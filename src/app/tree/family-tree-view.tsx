"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  Handle,
  Position,
} from "@xyflow/react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import "@xyflow/react/dist/style.css";

type TreePerson = {
  id: string;
  primaryName: string;
  occupation: string | null;
};

type TreeRelationship = {
  id: string;
  type: "PARENT_CHILD" | "SPOUSE";
  personAId: string;
  personBId: string;
  marriageStartDate: string | null;
  marriageEndDate: string | null;
  marriageEndReason: "DEATH" | "DIVORCE" | "SEPARATION" | "OTHER" | null;
};

export type TreeViewData = {
  rootId: string;
  people: TreePerson[];
  relationships: TreeRelationship[];
};

type FamilyNodeData = {
  person: TreePerson;
  isRoot: boolean;
  [key: string]: unknown;
};

function FamilyNode({ data }: NodeProps<Node<FamilyNodeData>>) {
  return (
    <>
      <Handle className="!invisible" position={Position.Top} type="target" />
      <Link
        className={`block min-w-44 rounded-2xl border bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
          data.isRoot
            ? "border-amber-600 ring-2 ring-amber-100"
            : "border-stone-300"
        }`}
        href={`/people/${data.person.id}`}
        title={`Open ${data.person.primaryName}'s profile`}
      >
        <span className="block font-semibold text-stone-950">
          {data.person.primaryName}
        </span>
        {data.person.occupation && (
          <span className="mt-1 block text-xs text-stone-500">
            {data.person.occupation}
          </span>
        )}
      </Link>
      <Handle className="!invisible" position={Position.Bottom} type="source" />
    </>
  );
}

const nodeTypes = { person: FamilyNode };

export default function FamilyTreeView({ data }: { data: TreeViewData }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { nodes, edges } = useMemo(() => buildGraph(data), [data]);
  const suggestions = data.people.filter((person) =>
    `${person.primaryName} ${person.id}`
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase()),
  );

  function jumpToPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const person = suggestions[0];
    if (person) router.push(`/tree?root=${encodeURIComponent(person.id)}`);
  }

  return (
    <div className="mt-8">
      <form
        className="flex max-w-xl flex-col gap-3 sm:flex-row"
        onSubmit={jumpToPerson}
      >
        <label className="sr-only" htmlFor="tree-person-search">
          Search and jump to a person
        </label>
        <input
          className="min-w-0 flex-1 rounded-full border border-stone-300 bg-white px-5 py-3 text-stone-950 outline-none ring-amber-700 placeholder:text-stone-400 focus:ring-2"
          list="tree-person-options"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search or jump to a person"
          value={query}
          id="tree-person-search"
        />
        <datalist id="tree-person-options">
          {data.people.map((person) => (
            <option key={person.id} value={person.primaryName} />
          ))}
        </datalist>
        <button
          className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
          type="submit"
        >
          Jump
        </button>
      </form>

      <div className="mt-6 h-[560px] overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesConnectable={false}
          zoomOnScroll
          panOnScroll
          aria-label="Interactive family tree"
        >
          <Background color="#d6d3d1" gap={24} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </div>
      {query && suggestions.length === 0 && (
        <p className="mt-3 text-sm text-stone-500">
          No person in this branch matches that search.
        </p>
      )}
    </div>
  );
}

function buildGraph(data: TreeViewData) {
  const root = data.people.find((person) => person.id === data.rootId);
  if (!root) return { nodes: [], edges: [] };

  const parents = data.relationships
    .filter(
      (relationship) =>
        relationship.type === "PARENT_CHILD" &&
        relationship.personBId === data.rootId,
    )
    .map((relationship) => relationship.personAId);
  const children = data.relationships
    .filter(
      (relationship) =>
        relationship.type === "PARENT_CHILD" &&
        relationship.personAId === data.rootId,
    )
    .map((relationship) => relationship.personBId);
  const spouses = data.relationships
    .filter(
      (relationship) =>
        relationship.type === "SPOUSE" &&
        (relationship.personAId === data.rootId ||
          relationship.personBId === data.rootId),
    )
    .map((relationship) =>
      relationship.personAId === data.rootId
        ? relationship.personBId
        : relationship.personAId,
    );
  const positions = new Map<string, { x: number; y: number }>([
    [root.id, { x: 0, y: 240 }],
  ]);

  parents.forEach((id, index) => {
    positions.set(id, {
      x: (index - (parents.length - 1) / 2) * 260,
      y: 20,
    });
  });
  spouses.forEach((id, index) => {
    if (!positions.has(id)) {
      positions.set(id, { x: 300, y: 120 + index * 150 });
    }
  });
  children.forEach((id, index) => {
    if (!positions.has(id)) {
      positions.set(id, {
        x: (index - (children.length - 1) / 2) * 260,
        y: 500,
      });
    }
  });

  const peopleById = new Map(data.people.map((person) => [person.id, person]));
  const nodes: Node<FamilyNodeData>[] = [...positions].flatMap(
    ([id, position]) => {
      const person = peopleById.get(id);
      return person
        ? [
            {
              id,
              type: "person",
              position,
              data: { person, isRoot: id === root.id },
            },
          ]
        : [];
    },
  );
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: Edge[] = data.relationships
    .filter(
      (relationship) =>
        nodeIds.has(relationship.personAId) &&
        nodeIds.has(relationship.personBId),
    )
    .map((relationship) => ({
      id: relationship.id,
      source: relationship.personAId,
      target: relationship.personBId,
      type: "smoothstep",
      style:
        relationship.type === "SPOUSE"
          ? { stroke: "#b45309", strokeDasharray: "6 4", strokeWidth: 2 }
          : { stroke: "#57534e", strokeWidth: 2 },
    }));

  return { nodes, edges };
}
