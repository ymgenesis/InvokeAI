from typing import Optional
from invokeai.app.invocations.baseinvocation import (
    BaseInvocation,
    Input,
    InvocationContext,
    invocation,
    InputField,
    FieldDescriptions,
)
from invokeai.app.invocations.primitives import ImageField, ImageOutput, BoardField
from invokeai.app.services.image_records.image_records_common import ImageCategory, ResourceOrigin
from invokeai.app.invocations.metadata import CoreMetadata
from invokeai.backend.image_util.safety_checker import SafetyChecker

@invocation("add_img_nsfw", title="Move NSFW Images to a Board", tags=["image", "nsfw"], category="image", version="1.0.0")
class ImageNSFWtoBoardInvocation(BaseInvocation):
    """Move NSFW-flagged images to a Board"""

    image: ImageField = InputField(description="The image to check")
    board: Optional[BoardField] = InputField(
        default=None, description="Pick Board to add output too", input=Input.Direct
    )
    metadata: CoreMetadata = InputField(
        default=None,
        description=FieldDescriptions.core_metadata,
        ui_hidden=True,
    )

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)

        logger = context.services.logger
        logger.debug("Running NSFW checker")

        if SafetyChecker.has_nsfw_concept(image):
            logger.info("A potentially NSFW image has been detected. Image will be sent to the board.")

            mask_dto = context.services.images.create(
                image=image,
                image_origin=ResourceOrigin.INTERNAL,
                image_category=ImageCategory.GENERAL,
                board_id=self.board.board_id if self.board else None,
                node_id=self.id,
                session_id=context.graph_execution_state_id,
                is_intermediate=self.is_intermediate,
                metadata=self.metadata.dict() if self.metadata else None,
                workflow=self.workflow,
            )

            return ImageOutput(
                image=ImageField(image_name=mask_dto.image_name),
                width=mask_dto.width,
                height=mask_dto.height,
            )
        else:
        # If the image is SFW:
            mask_dto = context.services.images.create(
                image=image,
                image_origin=ResourceOrigin.INTERNAL,
                image_category=ImageCategory.GENERAL,
                node_id=self.id,
                session_id=context.graph_execution_state_id,
                is_intermediate=self.is_intermediate,
                metadata=self.metadata.dict() if self.metadata else None,
                workflow=self.workflow,
            )

            return ImageOutput(
                image=ImageField(image_name=mask_dto.image_name),
                width=mask_dto.width,
                height=mask_dto.height,
            )



