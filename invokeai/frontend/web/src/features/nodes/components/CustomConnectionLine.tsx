import { useAppSelector } from 'app/store/storeHooks';
import { ConnectionLineComponentProps, getBezierPath } from 'reactflow';
import { FIELDS } from '../types/constants';

export const CustomConnectionLine = ({
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  toPosition,
}: ConnectionLineComponentProps) => {
  const pathParams = {
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  };
  const currentConnectionFieldType = useAppSelector(
    ({ nodes }) => nodes.currentConnectionFieldType
  );
  const [dAttr] = getBezierPath(pathParams);

  return (
    <g>
      <path
        fill="none"
        stroke={
          currentConnectionFieldType
            ? FIELDS[currentConnectionFieldType].colorCssVar
            : 'gray'
        }
        strokeWidth={2}
        className="react-flow__custom_connection-path"
        d={dAttr}
      />
    </g>
  );
};
