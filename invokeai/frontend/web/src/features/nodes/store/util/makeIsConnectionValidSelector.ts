import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import { getIsGraphAcyclic } from './getIsGraphAcyclic';
import { FieldType } from 'features/nodes/types/types';
import i18n from 'i18next';
import { HandleType } from 'reactflow';
import { validateSourceAndTargetTypes } from './validateSourceAndTargetTypes';

/**
 * NOTE: The logic here must be duplicated in `invokeai/frontend/web/src/features/nodes/hooks/useIsValidConnection.ts`
 * TODO: Figure out how to do this without duplicating all the logic
 */

export const makeConnectionErrorSelector = (
  nodeId: string,
  fieldName: string,
  handleType: HandleType,
  fieldType?: FieldType
) => {
  return createSelector(stateSelector, (state) => {
    if (!fieldType) {
      return i18n.t('nodes.noFieldType');
    }

    const { currentConnectionFieldType, connectionStartParams, nodes, edges } =
      state.nodes;

    if (!connectionStartParams || !currentConnectionFieldType) {
      return i18n.t('nodes.noConnectionInProgress');
    }

    const {
      handleType: connectionHandleType,
      nodeId: connectionNodeId,
      handleId: connectionFieldName,
    } = connectionStartParams;

    if (!connectionHandleType || !connectionNodeId || !connectionFieldName) {
      return i18n.t('nodes.noConnectionData');
    }

    const targetType =
      handleType === 'target' ? fieldType : currentConnectionFieldType;
    const sourceType =
      handleType === 'source' ? fieldType : currentConnectionFieldType;

    if (nodeId === connectionNodeId) {
      return i18n.t('nodes.cannotConnectToSelf');
    }

    if (handleType === connectionHandleType) {
      if (handleType === 'source') {
        return i18n.t('nodes.cannotConnectOutputToOutput');
      }
      return i18n.t('nodes.cannotConnectInputToInput');
    }

    // we have to figure out which is the target and which is the source
    const target = handleType === 'target' ? nodeId : connectionNodeId;
    const targetHandle =
      handleType === 'target' ? fieldName : connectionFieldName;
    const source = handleType === 'source' ? nodeId : connectionNodeId;
    const sourceHandle =
      handleType === 'source' ? fieldName : connectionFieldName;

    if (
      edges.find((edge) => {
        edge.target === target &&
          edge.targetHandle === targetHandle &&
          edge.source === source &&
          edge.sourceHandle === sourceHandle;
      })
    ) {
      // We already have a connection from this source to this target
      return i18n.t('nodes.cannotDuplicateConnection');
    }

    if (
      edges.find((edge) => {
        return edge.target === target && edge.targetHandle === targetHandle;
      }) &&
      // except CollectionItem inputs can have multiples
      targetType !== 'CollectionItem'
    ) {
      return i18n.t('nodes.inputMayOnlyHaveOneConnection');
    }

    if (!validateSourceAndTargetTypes(sourceType, targetType)) {
      return i18n.t('nodes.fieldTypesMustMatch');
    }

    const isGraphAcyclic = getIsGraphAcyclic(
      connectionHandleType === 'source' ? connectionNodeId : nodeId,
      connectionHandleType === 'source' ? nodeId : connectionNodeId,
      nodes,
      edges
    );

    if (!isGraphAcyclic) {
      return i18n.t('nodes.connectionWouldCreateCycle');
    }

    return null;
  });
};
