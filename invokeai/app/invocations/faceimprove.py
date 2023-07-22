from typing import Literal, Optional

import numpy as np
import mediapipe as mp
from PIL import Image, ImageFilter, ImageOps, ImageChops, ImageDraw
from pydantic import BaseModel, Field
from typing import Union
import cv2

from ..models.image import ImageCategory, ImageField, ResourceOrigin
from .baseinvocation import (
    BaseInvocation,
    BaseInvocationOutput,
    InvocationContext,
    InvocationConfig,
)


class PILInvocationConfig(BaseModel):
    """Helper class to provide all PIL invocations with additional config"""

    class Config(InvocationConfig):
        schema_extra = {
            "ui": {
                "tags": ["PIL", "image"],
            },
        }


class ImageMaskOutputFaceImprove(BaseInvocationOutput):
    """Base class for invocations that output an image and a mask"""

    # fmt: off
    type: Literal["image_mask_output"] = "image_mask_output"
    transparent_image:      ImageField = Field(default=None, description="The image with facial transparency")
    width:             int = Field(description="The width of the image in pixels")
    height:            int = Field(description="The height of the image in pixels")
    mask:       ImageField = Field(default=None, description="The output mask")
    original_image:      ImageField = Field(default=None, description="The original image untouched")
    # fmt: on

    class Config:
        schema_extra = {"required": ["type", "transparent_image", "width", "height", "mask", "original_image"]}


class FaceImproveInvocation(BaseInvocation, PILInvocationConfig):
    """MediaPipe face detection to scale and add detail to faces via inpaint/outpaint"""

    # fmt: off
    type: Literal["face_improve"] = "face_improve"

    # Inputs
    image: Optional[ImageField]  = Field(default=None, description="Image for face detection")
    x_offset: float = Field(default=0.0, description="Offset for the X-axis of the oval mask")
    y_offset: float = Field(default=0.0, description="Offset for the Y-axis of the oval mask")
    face_scale_factor: int = Field(default=2.0, description="Factor to scale the bounding box by before outputting")
    # fmt: on

    class Config(InvocationConfig):
        schema_extra = {
            "ui": {
                "title": "Face Improve",
                "tags": ["image", "face", "improve", "mask"]
            },
        }

    def generate_face_box_mask(self, pil_image):
        # Convert the PIL image to a NumPy array.
        np_image = np.array(pil_image, dtype=np.uint8)

        # Check if the input image has four channels (RGBA).
        if np_image.shape[2] == 4:
            # Convert RGBA to RGB by removing the alpha channel.
            np_image = np_image[:, :, :3]

        # Create a FaceMesh object for face landmark detection and mesh generation.
        face_mesh = mp.solutions.face_mesh.FaceMesh(min_detection_confidence=0.5, min_tracking_confidence=0.5)

        # Detect the face landmarks and mesh in the input image.
        results = face_mesh.process(np_image)

        # Check if any face is detected.
        if results.multi_face_landmarks:
            face_landmarks = results.multi_face_landmarks[0]  # Assuming only one face is detected.

            # Get the bounding box of the face mesh.
            x_coordinates = [landmark.x for landmark in face_landmarks.landmark]
            y_coordinates = [landmark.y for landmark in face_landmarks.landmark]
            x_min, x_max = min(x_coordinates), max(x_coordinates)
            y_min, y_max = min(y_coordinates), max(y_coordinates)

            # Calculate the width and height of the face mesh.
            mesh_width = int((x_max - x_min) * np_image.shape[1])
            mesh_height = int((y_max - y_min) * np_image.shape[0])

            # Get the center of the face.
            x_center = np.mean([landmark.x * np_image.shape[1] for landmark in face_landmarks.landmark])
            y_center = np.mean([landmark.y * np_image.shape[0] for landmark in face_landmarks.landmark])

            # Generate a binary face mask using the face mesh.
            mask_image = np.zeros_like(np_image[:, :, 0])
            if results.multi_face_landmarks:
                for face_landmarks in results.multi_face_landmarks:
                    face_landmark_points = np.array(
                        [[landmark.x * np_image.shape[1], landmark.y * np_image.shape[0]] for landmark in face_landmarks.landmark]
                    )

                    # Apply the scaling offsets to the face landmark points with a multiplier.
                    # Use smaller multiplier for finer-grained scaling.
                    scale_multiplier = 0.2
                    x_center = np.mean(face_landmark_points[:, 0])
                    y_center = np.mean(face_landmark_points[:, 1])
                    x_scaled = face_landmark_points[:, 0] + scale_multiplier * self.x_offset * (face_landmark_points[:, 0] - x_center)
                    y_scaled = face_landmark_points[:, 1] + scale_multiplier * self.y_offset * (face_landmark_points[:, 1] - y_center)

                    convex_hull = cv2.convexHull(np.column_stack((x_scaled, y_scaled)).astype(np.int32))
                    cv2.fillConvexPoly(mask_image, convex_hull, 255)

            # Convert the binary mask image to a PIL Image.
            mask_pil = Image.fromarray(mask_image, mode='L')

            return mask_pil, x_center, y_center, mesh_width, mesh_height

        else:
            raise ValueError("No face detected in the input image.")

    def invoke(self, context: InvocationContext) -> ImageMaskOutputFaceImprove:
        image = context.services.images.get_pil_image(self.image.image_name)

        # Generate the face box mask and get the center of the face.
        mask_pil, center_x, center_y, mesh_width, mesh_height = self.generate_face_box_mask(image)

        # Create an RGBA image with transparency
        rgba_image = image.convert("RGBA")

        inverted_mask = ImageOps.invert(mask_pil)
        rgba_image = Image.composite(rgba_image, Image.new("RGBA", image.size, (0, 0, 0, 0)), inverted_mask)

        # Calculate the crop boundaries for the output image and mask.
        mesh_width+=128
        mesh_height+=128
        crop_size = max(mesh_width, mesh_height, 384)  # Choose the larger size (384 or face mask size)
        if crop_size > 384:
            crop_size = (crop_size + 7) // 8 * 8   # Ensure crop side is multiple of 8
        print("Base bounding box: 384")
        print(f"Detected face width: {mesh_width}")
        print(f"Detected face height: {mesh_height}")
        print(f"Calculated bounding box: {crop_size}")
        print(f"Scale factor: {self.face_scale_factor}")
        if self.face_scale_factor == 0:
            print(f"Scaled bounding box: {crop_size}")
        else:
            print(f"Scaled bounding box: {crop_size * self.face_scale_factor}")
        x_min = int(center_x - crop_size // 2)
        y_min = int(center_y - crop_size // 2)
        x_max = x_min + crop_size
        y_max = y_min + crop_size

        # Crop the output image to the specified size with the center of the face mesh as the center.
        rgba_image = rgba_image.crop((x_min, y_min, x_max, y_max))

        # Resize image by a factor.
        if self.face_scale_factor > 0:
            new_size = (rgba_image.width * self.face_scale_factor, rgba_image.height * self.face_scale_factor)
            rgba_image = rgba_image.resize(new_size)

        # Create white mask with dimensions as transparency image for use with outpainting
        white_mask = Image.new("L", rgba_image.size, color=255)

        trans_image_dto = context.services.images.create(
            image=rgba_image,
            image_origin=ResourceOrigin.INTERNAL,
            image_category=ImageCategory.GENERAL,
            node_id=self.id,
            session_id=context.graph_execution_state_id,
            is_intermediate=self.is_intermediate,
        )
        orig_image_dto = context.services.images.create(
            image=image,
            image_origin=ResourceOrigin.INTERNAL,
            image_category=ImageCategory.GENERAL,
            node_id=self.id,
            session_id=context.graph_execution_state_id,
            is_intermediate=self.is_intermediate,
        )
        white_mask_dto = context.services.images.create(
            image=white_mask,
            image_origin=ResourceOrigin.INTERNAL,
            image_category=ImageCategory.MASK,
            node_id=self.id,
            session_id=context.graph_execution_state_id,
            is_intermediate=self.is_intermediate,
        )

        return ImageMaskOutputFaceImprove(
            transparent_image=ImageField(image_name=trans_image_dto.image_name),
            width=trans_image_dto.width,
            height=trans_image_dto.height,
            original_image=ImageField(image_name=orig_image_dto.image_name),
            mask=ImageField(image_name=white_mask_dto.image_name),
        )
