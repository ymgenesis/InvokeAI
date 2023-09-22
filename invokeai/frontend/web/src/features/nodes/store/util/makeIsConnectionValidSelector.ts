import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import { getIsGraphAcyclic } from 'features/nodes/hooks/useIsValidConnection';
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

    if (
      edges.find((edge) => {
        return edge.target === nodeId && edge.targetHandle === fieldName;
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
