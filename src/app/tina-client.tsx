"use client";

import type React from "react";
import { useTina } from "tinacms/dist/react";

export type UseTinaProps = {
  query: string;
  variables: Record<string, unknown>;
  data: Record<string, unknown>;
  forceExperimental?: string;
};

export type TinaClientProps<T> = {
  props: UseTinaProps & T;
  Component: React.ComponentType<{
    tinaProps: { data: Record<string, unknown> };
    props: UseTinaProps & T;
  }>;
};

export function TinaClient<T>({ props, Component }: TinaClientProps<T>) {
  if (process.env.NEXT_PUBLIC_DISABLE_TINA_EDITING === "true") {
    return <Component tinaProps={{ data: props.data }} props={{ ...props }} />;
  }

  return <EditableTinaClient props={props} Component={Component} />;
}

function EditableTinaClient<T>({ props, Component }: TinaClientProps<T>) {
  const { data } = props.forceExperimental
    ? useTina({
        query: props.query,
        variables: props.variables,
        data: props.data,
        experimental___selectFormByFormId() {
          return `content/docs/${props.forceExperimental}`;
        },
      })
    : useTina({
        query: props.query,
        variables: props.variables,
        data: props.data,
      });

  return <Component tinaProps={{ data }} props={{ ...props }} />;
}
