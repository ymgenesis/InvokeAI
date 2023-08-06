import { useAppSelector } from 'app/store/storeHooks';
import { ConnectionLineComponentProps, getBezierPath } from 'reactflow';
import { FIELDS } from '../types/constants';
import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';

const selector = createSelector(stateSelector, ({ nodes }) => {
  const { shouldAnimateEdges, currentConnectionFieldType, shouldColorEdges } =
    nodes;

  return {
    stroke:
      currentConnectionFieldType && shouldColorEdges
        ? FIELDS[currentConnectionFieldType].colorCssVar
        : 'gray',
    className: `react-flow__custom_connection-path ${
      shouldAnimateEdges ? 'animated' : ''
    }`,
  };
});

export const CustomConnectionLine = ({
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  toPosition,
}: ConnectionLineComponentProps) => {
  const { stroke, className } = useAppSelector(selector);

  const pathParams = {
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  };

  const [dAttr] = getBezierPath(pathParams);

  return (
    <g>
      <path
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        className={className}
        d={dAttr}
        style={{ opacity: 0.8 }}
      />
    </g>
  );
};
