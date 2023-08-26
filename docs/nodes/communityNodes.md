# Community Nodes

These are nodes that have been developed by the community, for the community. If you're not sure what a node is, you can learn more about nodes [here](overview.md).

If you'd like to submit a node for the community, please refer to the [node creation overview](contributingNodes.md).

To download a node, simply download the `.py` node file from the link and add it to the `invokeai/app/invocations` folder in your Invoke AI install location. Along with the node, an example node graph should be provided to help you get started with the node. 

To use a community node graph, download the the `.json` node graph file and load it into Invoke AI via the **Load Nodes** button on the Node Editor. 

## Community Nodes

### FaceTools

**Description:** FaceTools is a collection of nodes created to manipulate faces as you would in Unified Canvas. It includes FaceMask, FaceOff, and FacePlace. FaceMask autodetects a face in the image using MediaPipe and creates a mask from it. FaceOff similarly detects a face, then takes the face off of the image by adding a square bounding box around it and cropping/scaling it. FacePlace puts the bounded face image from FaceOff back onto the original image. Using these nodes with other inpainting node(s), you can put new faces on existing things, put new things around existing faces, and work closer with a face as a bounded image. Additionally, you can supply X and Y offset values to scale/change the shape of the mask for finer control on FaceMask and FaceOff. See GitHub repository below for usage examples.

**Node Link:** https://github.com/ymgenesis/FaceTools/

**FaceMask Output Examples** 

![5cc8abce-53b0-487a-b891-3bf94dcc8960](https://github.com/invoke-ai/InvokeAI/assets/25252829/43f36d24-1429-4ab1-bd06-a4bedfe0955e)
![b920b710-1882-49a0-8d02-82dff2cca907](https://github.com/invoke-ai/InvokeAI/assets/25252829/7660c1ed-bf7d-4d0a-947f-1fc1679557ba)
![71a91805-fda5-481c-b380-264665703133](https://github.com/invoke-ai/InvokeAI/assets/25252829/f8f6a2ee-2b68-4482-87da-b90221d5c3e2)

### Ideal Size

**Description:** This node calculates an ideal image size for a first pass of a multi-pass upscaling. The aim is to avoid duplication that results from choosing a size larger than the model is capable of.

**Node Link:** https://github.com/JPPhoto/ideal-size-node


--------------------------------
### Retroize

**Description:** Retroize is a collection of nodes for InvokeAI to "Retroize" images. Any image can be given a fresh coat of retro paint with these nodes, either from your gallery or from within the graph itself. It includes nodes to pixelize, quantize, palettize, and ditherize images; as well as to retrieve palettes from existing images.

**Node Link:** https://github.com/Ar7ific1al/invokeai-retroizeinode/

**Retroize Output Examples**

![image](https://github.com/Ar7ific1al/InvokeAI_nodes_retroize/assets/2306586/de8b4fa6-324c-4c2d-b36c-297600c73974)

--------------------------------
### GPT2RandomPromptMaker

**Description:** A node for InvokeAI utilizes the GPT-2 language model to generate random prompts based on a provided seed and context.

**Node Link:** https://github.com/mickr777/GPT2RandomPromptMaker

**Output Examples** 

Generated Prompt: An enchanted weapon will be usable by any character regardless of their alignment.

![9acf5aef-7254-40dd-95b3-8eac431dfab0 (1)](https://github.com/mickr777/InvokeAI/assets/115216705/8496ba09-bcdd-4ff7-8076-ff213b6a1e4c)

--------------------------------
### Load Video Frame

**Description:** This is a video frame image provider + indexer/video creation nodes for hooking up to iterators and ranges and ControlNets and such for invokeAI node experimentation. Think animation + ControlNet outputs.

**Node Link:** https://github.com/helix4u/load_video_frame

**Example Node Graph:**  https://github.com/helix4u/load_video_frame/blob/main/Example_Workflow.json

**Output Example:** 
=======
![Example animation](https://github.com/helix4u/load_video_frame/blob/main/testmp4_embed_converted.gif)
[Full mp4 of Example Output test.mp4](https://github.com/helix4u/load_video_frame/blob/main/test.mp4)

--------------------------------

### Oobabooga

**Description:** asks a local LLM running in Oobabooga's Text-Generation-Webui to write a prompt based on the user input.

**Link:** https://github.com/sammyf/oobabooga-node


**Example:**

"describe a new mystical  creature in its natural environment"

*can return*

"The mystical creature I am describing to you is called the "Glimmerwing". It is a majestic, iridescent being that inhabits the depths of the most enchanted forests and glimmering lakes. Its body is covered in shimmering scales that reflect every color of the rainbow, and it has delicate, translucent wings that sparkle like diamonds in the sunlight. The Glimmerwing's home is a crystal-clear lake, surrounded by towering trees with leaves that shimmer like jewels. In this serene environment, the Glimmerwing spends its days swimming gracefully through the water, chasing schools of glittering fish and playing with the gentle ripples of the lake's surface.
As the sun sets, the Glimmerwing perches on a branch of one of the trees, spreading its wings to catch the last rays of light. The creature's scales glow softly, casting a rainbow of colors across the forest floor. The Glimmerwing sings a haunting melody, its voice echoing through the stillness of the night air. Its song is said to have the power to heal the sick and bring peace to troubled souls. Those who are lucky enough to hear the Glimmerwing's song are forever changed by its beauty and grace."

![glimmerwing_small](https://github.com/sammyf/oobabooga-node/assets/42468608/cecdd820-93dd-4c35-abbf-607e001fb2ed)

**Requirement**

a Text-Generation-Webui instance (might work remotely too, but I never tried it) and obviously InvokeAI 3.x

**Note**

This node works best with SDXL models, especially as the style can be described independantly of the LLM's output.

--------------------------------

### Example Node Template

**Description:** This node allows you to do super cool things with InvokeAI.

**Node Link:** https://github.com/invoke-ai/InvokeAI/fake_node.py

**Example Node Graph:**  https://github.com/invoke-ai/InvokeAI/fake_node_graph.json

**Output Examples** 

![Example Image](https://invoke-ai.github.io/InvokeAI/assets/invoke_ai_banner.png){: style="height:115px;width:240px"}


## Disclaimer

The nodes linked have been developed and contributed by members of the Invoke AI community. While we strive to ensure the quality and safety of these contributions, we do not guarantee the reliability or security of the nodes. If you have issues or concerns with any of the nodes below, please raise it on GitHub or in the Discord.


## Help
If you run into any issues with a node, please post in the [InvokeAI Discord](https://discord.gg/ZmtBAhwWhy). 

