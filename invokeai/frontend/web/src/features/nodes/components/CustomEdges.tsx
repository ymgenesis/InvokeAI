import { reduce } from 'lodash-es';
import { ComponentType } from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from 'reactflow';
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

export const edgeTypes = reduce(
  FIELDS,
  (acc, field, key) => {
    acc[key] = buildFieldEdge(field);
    return acc;
  },
  {} as Record<string, ComponentType<EdgeProps>>
);
