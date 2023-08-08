import {
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import { useAppDispatch } from 'app/store/storeHooks';
import IAITextarea from 'common/components/IAITextarea';
import { nodeNotesChanged } from 'features/nodes/store/nodesSlice';
import {
  InvocationNodeData,
  InvocationTemplate,
} from 'features/nodes/types/types';
import { ChangeEvent, memo, useCallback } from 'react';
import { FaInfoCircle } from 'react-icons/fa';

interface Props {
  data: InvocationNodeData;
  template: InvocationTemplate;
}

const NodeNotesEdit = (props: Props) => {
  const { data, template } = props;
  const { notes } = data;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const dispatch = useAppDispatch();
  const handleNotesChanged = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      dispatch(nodeNotesChanged({ nodeId: data.id, notes: e.target.value }));
    },
    [data.id, dispatch]
  );

  return (
    <>
      <Tooltip
        label={<TooltipContent template={template} notes={notes} />}
        placement="top"
        shouldWrapChildren
      >
        <Flex
          onClick={onOpen}
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            w: 8,
            h: 8,
            cursor: 'pointer',
          }}
        >
          <Icon
            as={FaInfoCircle}
            sx={{ boxSize: 4, w: 8, color: 'base.400' }}
          />
        </Flex>
      </Tooltip>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{data.label || template.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Notes</FormLabel>
              <IAITextarea
                value={notes}
                onChange={handleNotesChanged}
                rows={10}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter />
        </ModalContent>
      </Modal>
    </>
  );
};

export default memo(NodeNotesEdit);

type TooltipContentProps = {
  template: InvocationTemplate;
  notes?: string;
};

const TooltipContent = ({ template, notes }: TooltipContentProps) => {
  return (
    <Flex sx={{ flexDir: 'column' }}>
      <Text sx={{ fontWeight: 600 }}>{template.title}</Text>
      <Text sx={{ opacity: 0.7, fontStyle: 'oblique 5deg' }}>
        {template.description}
      </Text>
      {notes && <Text>{notes}</Text>}
    </Flex>
  );
};
