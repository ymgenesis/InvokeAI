import {
  Divider,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import IAIIconButton from 'common/components/IAIIconButton';
import IAISwitch from 'common/components/IAISwitch';
import { ChangeEvent, useCallback } from 'react';
import { FaCog } from 'react-icons/fa';
import {
  shouldAnimateEdgesChanged,
  shouldColorEdgesChanged,
  shouldSnapToGridChanged,
  shouldValidateGraphChanged,
} from '../store/nodesSlice';

const selector = createSelector(stateSelector, ({ nodes }) => {
  const {
    shouldAnimateEdges,
    shouldValidateGraph,
    shouldSnapToGrid,
    shouldColorEdges,
  } = nodes;
  return {
    shouldAnimateEdges,
    shouldValidateGraph,
    shouldSnapToGrid,
    shouldColorEdges,
  };
});

const NodeEditorSettings = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const dispatch = useAppDispatch();
  const {
    shouldAnimateEdges,
    shouldValidateGraph,
    shouldSnapToGrid,
    shouldColorEdges,
  } = useAppSelector(selector);

  const handleChangeShouldValidate = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      dispatch(shouldValidateGraphChanged(e.target.checked));
    },
    [dispatch]
  );

  const handleChangeShouldAnimate = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      dispatch(shouldAnimateEdgesChanged(e.target.checked));
    },
    [dispatch]
  );

  const handleChangeShouldSnap = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      dispatch(shouldSnapToGridChanged(e.target.checked));
    },
    [dispatch]
  );

  const handleChangeShouldColor = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      dispatch(shouldColorEdgesChanged(e.target.checked));
    },
    [dispatch]
  );

  return (
    <>
      <IAIIconButton
        aria-label="Node Editor Settings"
        icon={<FaCog />}
        onClick={onOpen}
      />

      <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Node Editor Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex
              sx={{
                flexDirection: 'column',
                gap: 4,
                py: 4,
              }}
            >
              <IAISwitch
                onChange={handleChangeShouldAnimate}
                isChecked={shouldAnimateEdges}
                label="Animated Edges"
                helperText="Animate selected edges and edges connected to selected nodes"
              />
              <Divider />
              <IAISwitch
                isChecked={shouldValidateGraph}
                onChange={handleChangeShouldValidate}
                label="Validate Connections and Graph"
                helperText="Prevent invalid connections from being made, and invalid graphs from being invoked"
              />
              <Divider />
              <IAISwitch
                isChecked={shouldSnapToGrid}
                onChange={handleChangeShouldSnap}
                label="Snap to Grid"
                helperText="Nodes snap to grid when moved"
              />
              <Divider />
              <IAISwitch
                isChecked={shouldColorEdges}
                onChange={handleChangeShouldColor}
                label="Color Edges"
                helperText="Color edges according to their connected nodes"
              />
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default NodeEditorSettings;
