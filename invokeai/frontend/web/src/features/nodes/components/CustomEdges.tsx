import { Badge, Flex } from '@chakra-ui/react';
import { useChakraThemeTokens } from 'common/hooks/useChakraThemeTokens';
import { reduce } from 'lodash-es';
import { ComponentType } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from 'reactflow';
import { FIELDS } from '../types/constants';
import { FieldUIConfig } from '../types/types';

const buildFieldEdge = (fieldUiConfig: FieldUIConfig) => {
  const CustomEdge = ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    selected,
  }: EdgeProps) => {
    const [edgePath] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    return (
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: selected ? 3 : 2,
          stroke: fieldUiConfig.colorCssVar,
          opacity: selected ? 1 : 0.5,
        }}
      />
    );
  };

  return CustomEdge;
};

const CollapsedEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
  selected,
}: EdgeProps<{ count: number }>) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { base500 } = useChakraThemeTokens();

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: selected ? 3 : 2,
          stroke: base500,
          opacity: selected ? 1 : 0.5,
        }}
      />
      {data && (
        <EdgeLabelRenderer>
          <Flex
            sx={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
            className="nodrag nopan"
          >
            <Badge
              variant="solid"
              sx={{
                bg: 'base.500',
                opacity: selected ? 1 : 0.5,
                boxShadow: 'base',
              }}
            >
              {data.count}
            </Badge>
          </Flex>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export const edgeTypes = reduce(
  FIELDS,
  (acc, field, key) => {
    acc[key] = buildFieldEdge(field);
    return acc;
  },
  {
    collapsed: CollapsedEdge,
  } as Record<string, ComponentType<EdgeProps>>
);
