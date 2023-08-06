import {
  Box,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  Tooltip,
  useEditableControls,
} from '@chakra-ui/react';
import { useAppDispatch } from 'app/store/storeHooks';
import { DRAG_HANDLE_CLASSNAME } from 'features/nodes/hooks/useBuildInvocation';
import { nodeUserLabelChanged } from 'features/nodes/store/nodesSlice';
import { InvocationValue } from 'features/nodes/types/types';
import { MouseEvent, memo, useCallback, useState } from 'react';

interface IAINodeTitleProps {
  data: InvocationValue;
  title: string;
  description: string;
}

const IAINodeTitle = (props: IAINodeTitleProps) => {
  const { data, title, description } = props;
  const { userLabel } = data;
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(userLabel || title);

  const handleSubmit = useCallback(
    async (newTitle: string) => {
      setIsEditing(false);
      // empty strings are not allowed
      if (!newTitle.trim()) {
        setLocalTitle(title);
        return;
      }

      // don't updated the board name if it hasn't changed
      if (newTitle === (userLabel || title)) {
        return;
      }

      dispatch(nodeUserLabelChanged({ nodeId: data.id, userLabel: newTitle }));

      // update local state
      setLocalTitle(newTitle);
    },
    [data.id, dispatch, title, userLabel]
  );

  const handleChange = useCallback((newTitle: string) => {
    setLocalTitle(newTitle);
  }, []);

  return (
    <Flex
      className={isEditing ? 'nopan' : DRAG_HANDLE_CLASSNAME}
      sx={{
        w: 'full',
        h: 'full',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isEditing ? 'text' : undefined,
      }}
    >
      <Tooltip
        label={`${title}: ${description}`}
        placement="top"
        hasArrow
        openDelay={500}
      >
        <Editable
          value={localTitle}
          onChange={handleChange}
          onSubmit={handleSubmit}
          sx={{
            position: 'relative',
            w: 'full',
          }}
        >
          <EditablePreview
            fontSize="sm"
            sx={{
              p: 0,
              textAlign: 'center',
              fontWeight: 600,
              color: 'base.700',
              _dark: { color: 'base.200' },
            }}
            noOfLines={1}
          />
          <EditableInput
            fontSize="sm"
            sx={{
              p: 0,
              fontWeight: 600,
              _focusVisible: {
                p: 0,
                textAlign: 'center',
                boxShadow: 'none',
              },
            }}
          />
          <EditableControls setIsEditing={setIsEditing} />
        </Editable>
      </Tooltip>
    </Flex>
  );
};

export default memo(IAINodeTitle);

type EditableControlsProps = {
  setIsEditing: (isEditing: boolean) => void;
};

function EditableControls(props: EditableControlsProps) {
  const { isEditing, getEditButtonProps } = useEditableControls();
  const handleDoubleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const { onClick } = getEditButtonProps();
      if (!onClick) {
        return;
      }
      onClick(e);
      props.setIsEditing(true);
    },
    [getEditButtonProps, props]
  );

  return isEditing ? null : (
    <Box
      onDoubleClick={handleDoubleClick}
      sx={{
        position: 'absolute',
        w: 'full',
        h: 'full',
        top: 0,
      }}
    />
  );
}
