import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { defaultSelectorOptions } from 'app/store/util/defaultMemoizeOptions';
import IAIInput from 'common/components/IAIInput';
import IAITextarea from 'common/components/IAITextarea';
import {
  workflowAuthorChanged,
  workflowDescriptionChanged,
  workflowNameChanged,
  workflowNotesChanged,
  workflowTagsChanged,
} from 'features/nodes/store/nodesSlice';
import { ChangeEvent, memo, useCallback } from 'react';

const selector = createSelector(
  stateSelector,
  ({ nodes }) => {
    const { author, name, description, tags, notes } = nodes.workflow;

    return {
      name,
      author,
      description,
      tags,
      notes,
    };
  },
  defaultSelectorOptions
);

const WorkflowPanel = () => {
  const { author, name, description, tags, notes } = useAppSelector(selector);
  const dispatch = useAppDispatch();

  const handleChangeName = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      dispatch(workflowNameChanged(e.target.value));
    },
    [dispatch]
  );
  const handleChangeAuthor = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      dispatch(workflowAuthorChanged(e.target.value));
    },
    [dispatch]
  );
  const handleChangeDescription = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      dispatch(workflowDescriptionChanged(e.target.value));
    },
    [dispatch]
  );
  const handleChangeNotes = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      dispatch(workflowNotesChanged(e.target.value));
    },
    [dispatch]
  );
  const handleChangeTags = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      dispatch(workflowTagsChanged(e.target.value));
    },
    [dispatch]
  );

  return (
    <Flex
      layerStyle="first"
      sx={{
        w: 'full',
        h: 'full',
        borderRadius: 'base',
        p: 4,
      }}
    >
      <Tabs
        variant="line"
        sx={{ display: 'flex', flexDir: 'column', w: 'full', h: 'full' }}
      >
        <TabList>
          <Tab>General</Tab>
          <Tab>Notes</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Flex
              sx={{
                flexDir: 'column',
                alignItems: 'flex-start',
                gap: 2,
                h: 'full',
              }}
            >
              <Flex sx={{ gap: 2, w: 'full' }}>
                <IAIInput
                  label="Workflow Name"
                  value={name}
                  onChange={handleChangeName}
                />
                <IAIInput
                  label="Author"
                  value={author}
                  onChange={handleChangeAuthor}
                />
              </Flex>
              <IAIInput label="Tags" value={tags} onChange={handleChangeTags} />
              <FormControl as={Flex} sx={{ flexDir: 'column', h: 'full' }}>
                <FormLabel>Description</FormLabel>
                <Box sx={{ pos: 'relative', h: 'full' }}>
                  <IAITextarea
                    onChange={handleChangeDescription}
                    value={description}
                    fontSize="sm"
                    sx={{ resize: 'none', h: 'full' }}
                  />
                  <Box sx={{ pos: 'absolute', bottom: 2, right: 2 }}>
                    <Text
                      sx={{
                        fontSize: 'xs',
                        opacity: 0.5,
                        userSelect: 'none',
                        color: description.length > 128 ? 'red.600' : 'inherit',
                      }}
                    >
                      {description.length}/128
                    </Text>
                  </Box>
                </Box>
              </FormControl>
            </Flex>
          </TabPanel>
          <TabPanel>
            <Box sx={{ pos: 'relative', h: 'full' }}>
              <IAITextarea
                onChange={handleChangeNotes}
                value={notes}
                fontSize="sm"
                sx={{ h: 'full', resize: 'none' }}
              />
              <Box sx={{ pos: 'absolute', bottom: 2, right: 2 }}>
                <Text
                  sx={{
                    fontSize: 'xs',
                    opacity: 0.5,
                    userSelect: 'none',
                  }}
                >
                  {notes.length}
                </Text>
              </Box>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  );
};

export default memo(WorkflowPanel);
