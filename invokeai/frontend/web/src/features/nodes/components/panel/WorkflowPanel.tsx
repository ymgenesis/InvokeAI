import {
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react';
import { memo } from 'react';
import GeneralTab from './workflow/GeneralTab';
import NotesTab from './workflow/NotesTab';
import WorkflowTab from './workflow/WorkflowTab';
import LinearTab from './workflow/LinearTab';

const WorkflowPanel = () => {
  return (
    <Flex
      layerStyle="first"
      sx={{
        flexDir: 'column',
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
          <Tab>Linear</Tab>
          <Tab>General</Tab>
          <Tab>Notes</Tab>
          <Tab>Workflow</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <LinearTab />
          </TabPanel>
          <TabPanel>
            <GeneralTab />
          </TabPanel>
          <TabPanel>
            <NotesTab />
          </TabPanel>
          <TabPanel>
            <WorkflowTab />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  );
};

export default memo(WorkflowPanel);
