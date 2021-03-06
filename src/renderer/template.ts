import React from "react";

import { render } from "./renderer";
import { isJsFile } from "../utils";
import { TemplateContext, TemplateRenderResult } from "../types";

/**
 * render a file with react. This function automatically transforms jsx to js before importing the component.
 * 
 * @param filepath the path to file to render
 */
export async function renderTemplate(filepath: string, context: TemplateContext): Promise<TemplateRenderResult | undefined> {
  if (!isJsFile(filepath)) {
    return undefined;
  }

  let data = undefined;
  try {
    data = await importComponent(filepath, context);
  } catch(err) {
    throw err;
  }

  // undefined, null etc. cases
  if (!data) {
    return undefined;
  }
  return renderFile(data);
}

/**
 * Imports a given file and return the imported component
 * 
 * @private
 * @param filepath to import
 */
function importComponent(filepath: string, context: TemplateContext): Promise<React.ReactElement | undefined> {
  return new Promise((resolve, reject) => {
    try {
      // we should import component only in NodeJS
      if (require === undefined) resolve(undefined);
      // remove from cache imported file
      delete require.cache[require.resolve(filepath)];

      const component = require(filepath);
      if (typeof component === "function") resolve(component(context));
      if (typeof component.default === "function") resolve(component.default(context));
      resolve(undefined);
    } catch(err) {
      reject(err);
    }
  });
}

/**
 * Render a single File component.
 * 
 * @private
 * @param {React.ReactElement} file to import
 */
function renderFile(file: React.ReactElement): TemplateRenderResult | undefined {
  if (typeof file !== "object") {
    return undefined;
  }
  const { type, props = {} } = file;

  // if no File component is found as root, don't render it.
  if (typeof type !== "function" || type.name !== "File") {
    return undefined;
  }

  return {
    content: render(props.children),
    metadata: {
      fileName: props.name,
      permissions: props.permissions,
    }
  };
}
