import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import { getIsGraphAcyclic } from 'features/nodes/hooks/useIsValidConnection';
import { FieldType } from 'features/nodes/types/types';
import { HandleType } from 'reactflow';

export const makeConnectionErrorSelector = (
  nodeId: string,
  fieldName: string,
  handleType: HandleType,
  fieldType: FieldType
) =>
  createSelector(stateSelector, (state) => {
    const { currentConnectionFieldType, connectionStartParams, nodes, edges } =
      state.nodes;
    if (!connectionStartParams || !currentConnectionFieldType) {
      // there is no connection in progress
      return 'No connection in progress';
    }

    const {
      handleType: connectionHandleType,
      nodeId: connectionNodeId,
      handleId: connectionFieldName,
    } = connectionStartParams;

    if (!connectionHandleType || !connectionNodeId || !connectionFieldName) {
      // connection in progress with no handle type or node id???
      return 'No connection data';
    }

    if (nodeId === connectionNodeId) {
      // cannot connect to self
      return 'Cannot connect to self';
    }

    if (handleType === connectionHandleType) {
      // cannot connect to same handle type (eg cannot connect input to input or output to output)
      if (handleType === 'source') {
        return 'Cannot connect output to output';
      }
      return 'Cannot connect input to input';
    }

    if (
      handleType === 'target' &&
      edges.find((edge) => {
        return edge.target === nodeId && edge.targetHandle === fieldName;
      })
    ) {
      // Connection is invalid if target already has a connection
      return 'Inputs may only have one connection';
    }

    if (fieldType !== currentConnectionFieldType) {
      // field types must match
      return 'Field types must match';
    }

    const isGraphAcyclic = getIsGraphAcyclic(
      connectionHandleType === 'source' ? connectionNodeId : nodeId,
      connectionHandleType === 'source' ? nodeId : connectionNodeId,
      nodes,
      edges
    );

    if (!isGraphAcyclic) {
      // connection would create a cycle
      return 'Connection would create a cycle';
    }

    return null;
  });
