import { OpenAPIV3 } from 'openapi-types';
import { Edge, Node, OnConnectStartParams, ReactFlowInstance } from 'reactflow';
import {
  FieldType,
  InvocationEdgeExtra,
  InvocationTemplate,
  InvocationValue,
  Workflow,
} from '../types/types';

export type NodesState = {
  nodes: Node<InvocationValue>[];
  edges: Edge<InvocationEdgeExtra>[];
  schema: OpenAPIV3.Document | null;
  invocationTemplates: Record<string, InvocationTemplate>;
  connectionStartParams: OnConnectStartParams | null;
  currentConnectionFieldType: FieldType | null;
  shouldShowFieldTypeLegend: boolean;
  shouldShowMinimapPanel: boolean;
  editorInstance: ReactFlowInstance | undefined;
  progressNodeSize: { width: number; height: number };
  shouldValidateGraph: boolean;
  shouldAnimateEdges: boolean;
  nodeOpacity: number;
  shouldSnapToGrid: boolean;
  shouldColorEdges: boolean;
  selectedNodes: string[];
  selectedEdges: string[];
  workflow: Omit<Workflow, 'nodes' | 'edges'>;
};
