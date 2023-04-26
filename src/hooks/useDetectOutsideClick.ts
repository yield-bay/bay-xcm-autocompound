import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 *
 * @param el Element to detect outside click
 * @param initialState Initial state of the element
 * @returns a tuple of [isActive, setIsActive]
 */
const useDetectOutsideClick = (
  el: any,
  initialState: boolean
): [boolean, Dispatch<SetStateAction<boolean>>] => {
  const [isActive, setIsActive] = useState(initialState);

  useEffect(() => {
    const pageClickEvent = (e: any) => {
      const elements = Array.isArray(el) ? el : [el];
      let outside = true;

      // If the active element exists and is clicked outside of
      elements.forEach((element) => {
        if (element.current !== null && element.current.contains(e.target)) {
          outside = false;
        }
      });

      if (outside) setIsActive(false);
    };

    // If the item is active (ie open) then listen for clicks
    if (isActive) {
      window.addEventListener('click', pageClickEvent);
    }

    return () => {
      window.removeEventListener('click', pageClickEvent);
    };
  }, [isActive, el]);

  return [isActive, setIsActive];
};

export default useDetectOutsideClick;
