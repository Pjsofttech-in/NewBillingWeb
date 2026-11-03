import {lazy, Suspense} from "react";

/*
 * Loads a pop-up window's code only when it is first opened (smaller first load for every page).
 *
 *   const CreateOrderModal = lazyModal(() => import("./CreateOrderModal"));
 *   <CreateOrderModal isOpen={open} ... />      // nothing is downloaded until open is true
 *
 * - Windows that take an `isOpen` prop render nothing while it is false (and start fresh when reopened).
 * - Windows the page mounts only while they are needed (no `isOpen` prop) load when they first appear.
 */
export function lazyModal(loader) {
  const Component = lazy(loader);

  return function LazyModal(props) {
    if (props.isOpen === false || props.isOpen === undefined) {
      if ("isOpen" in props) return null;
    }
    return (
      <Suspense fallback={null}>
        <Component {...props} />
      </Suspense>
    );
  };
}
