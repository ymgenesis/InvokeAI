from typing import Any, Callable, Literal, Union
from pydantic import Field
from invokeai.app.invocations.baseinvocation import BaseInvocation, BaseInvocationOutput, InvocationContext
from invokeai.app.invocations.image import ImageField


# Define test invocations before importing anything that uses invocations
class ListPassThroughInvocationOutput(BaseInvocationOutput):
    type: Literal["test_list_output"] = "test_list_output"

    collection: list[ImageField] = Field(default_factory=list)


class ListPassThroughInvocation(BaseInvocation):
    type: Literal["test_list"] = "test_list"

    collection: list[ImageField] = Field(default_factory=list)

    def invoke(self, context: InvocationContext) -> ListPassThroughInvocationOutput:
        return ListPassThroughInvocationOutput(collection=self.collection)


class PromptTestInvocationOutput(BaseInvocationOutput):
    type: Literal["test_prompt_output"] = "test_prompt_output"

    prompt: str = Field(default="")


class PromptTestInvocation(BaseInvocation):
    type: Literal["test_prompt"] = "test_prompt"

    prompt: str = Field(default="")

    def invoke(self, context: InvocationContext) -> PromptTestInvocationOutput:
        return PromptTestInvocationOutput(prompt=self.prompt)


class ErrorInvocation(BaseInvocation):
    type: Literal["test_error"] = "test_error"

    def invoke(self, context: InvocationContext) -> PromptTestInvocationOutput:
        raise Exception("This invocation is supposed to fail")


class ImageTestInvocationOutput(BaseInvocationOutput):
    type: Literal["test_image_output"] = "test_image_output"

    image: ImageField = Field()


class TextToImageTestInvocation(BaseInvocation):
    type: Literal["test_text_to_image"] = "test_text_to_image"

    prompt: str = Field(default="")

    def invoke(self, context: InvocationContext) -> ImageTestInvocationOutput:
        return ImageTestInvocationOutput(image=ImageField(image_name=self.id))


class ImageToImageTestInvocation(BaseInvocation):
    type: Literal["test_image_to_image"] = "test_image_to_image"

    prompt: str = Field(default="")
    image: Union[ImageField, None] = Field(default=None)

    def invoke(self, context: InvocationContext) -> ImageTestInvocationOutput:
        return ImageTestInvocationOutput(image=ImageField(image_name=self.id))


class PromptCollectionTestInvocationOutput(BaseInvocationOutput):
    type: Literal["test_prompt_collection_output"] = "test_prompt_collection_output"
    collection: list[str] = Field(default_factory=list)


class PromptCollectionTestInvocation(BaseInvocation):
    type: Literal["test_prompt_collection"] = "test_prompt_collection"
    collection: list[str] = Field()

    def invoke(self, context: InvocationContext) -> PromptCollectionTestInvocationOutput:
        return PromptCollectionTestInvocationOutput(collection=self.collection.copy())


# Importing these at the top breaks previous tests
from invokeai.app.services.events import EventServiceBase  # noqa: E402
from invokeai.app.services.graph import Edge, EdgeConnection  # noqa: E402


def create_edge(from_id: str, from_field: str, to_id: str, to_field: str) -> Edge:
    return Edge(
        source=EdgeConnection(node_id=from_id, field=from_field),
        destination=EdgeConnection(node_id=to_id, field=to_field),
    )


class TestEvent:
    event_name: str
    payload: Any

    def __init__(self, event_name: str, payload: Any):
        self.event_name = event_name
        self.payload = payload


class TestEventService(EventServiceBase):
    events: list

    def __init__(self):
        super().__init__()
        self.events = list()

    def dispatch(self, event_name: str, payload: Any) -> None:
        pass


def wait_until(condition: Callable[[], bool], timeout: int = 10, interval: float = 0.1) -> None:
    import time

    start_time = time.time()
    while time.time() - start_time < timeout:
        if condition():
            return
        time.sleep(interval)
    raise TimeoutError("Condition not met")
