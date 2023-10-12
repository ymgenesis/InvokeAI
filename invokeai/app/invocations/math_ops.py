# Copyright (c) 2023 Jonathan S. Pollack (https://github.com/JPPhoto)

from invokeai.app.invocations.primitives import FloatOutput, IntegerOutput

from invokeai.app.invocations.baseinvocation import (
    BaseInvocation,
    BaseInvocationOutput,
    InputField,
    InvocationContext,
    invocation,
    invocation_output,
    OutputField,
)


@invocation_output("min_max_avg_output")
class MinMaxAvgOutput(BaseInvocationOutput):
    """Base class for min/max output"""

    min: float = OutputField()
    max: float = OutputField()
    avg: float = OutputField()


@invocation("min_max_avg", title="Min/Max/Average", tags=["min_max_avg"], version="1.0.0")
class MinMaxAvgInvocation(BaseInvocation):
    """Does a min or max calculation on two numbers passed in."""

    x: float = InputField(default=0.0)
    y: float = InputField(default=0.0)

    def invoke(self, context: InvocationContext) -> MinMaxAvgOutput:
        return MinMaxAvgOutput(
            min=min(self.x, self.y),
            max=max(self.x, self.y),
            avg=((self.x + self.y) / 2),
        )

@invocation("int_conversion", title="Integer to Float Conversion", version="1.0.0")
class IntConversionInvocation(BaseInvocation):
    """Converts an int to a float"""

    value: int = InputField()

    def invoke(self, context: InvocationContext) -> FloatOutput:
        return FloatOutput(value=float(self.value))


@invocation("float_conversion", title="Float to Integer Conversion", version="1.0.0")
class FloatConversionInvocation(BaseInvocation):
    """Converts a float to an int"""

    value: float = InputField()

    def invoke(self, context: InvocationContext) -> IntegerOutput:
        return IntegerOutput(value=int(self.value))
