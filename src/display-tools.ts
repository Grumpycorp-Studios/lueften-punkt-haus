//
// Display tools
//

export function appendChildren(parentElement: HTMLElement, children: (HTMLElement | Text)[]) {
  children.forEach((child) => parentElement.appendChild(child));
}

export function createElementWithChildren<ElementType extends keyof HTMLElementTagNameMap>(
  elementType: ElementType,
  ...children: (HTMLElement | Text | string)[]
): HTMLElementTagNameMap[ElementType] {
  const element = document.createElement(elementType);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function isString(value: any): value is string {
    return typeof value === "string" || value instanceof String;
  }

  appendChildren(
    element,
    children.flatMap((child) =>
      isString(child)
        ? // Auto-convert string into broken text lines
          child
            .split(/\r?\n/)
            .flatMap((line, index) =>
              index > 0
                ? [document.createElement("br"), document.createTextNode(line)]
                : document.createTextNode(line)
            )
        : // Forward child as-is
          child
    )
  );

  return element;
}

export function createElementWithInitializerAndChildren<
  ElementType extends keyof HTMLElementTagNameMap,
>(
  elementType: ElementType,
  initializer: (element: HTMLElementTagNameMap[ElementType]) => void,
  ...children: (HTMLElement | Text | string)[]
): HTMLElementTagNameMap[ElementType] {
  const element = createElementWithChildren(elementType, ...children);

  initializer(element);

  return element;
}

export function createAnchorElementWithChildren(
  url: URL,
  ...children: (HTMLElement | Text | string)[]
) {
  return createElementWithInitializerAndChildren(
    "a",
    (anchor) => (anchor.href = url.href),
    ...children
  );
}

//
// Display: Not found
//

export function displayNotFound(): HTMLElement[] {
  return [
    createElementWithChildren("h2", "Not found"),
    createElementWithChildren("div", "Apologies - we must have dropped some data somewhere..."),
  ];
}
