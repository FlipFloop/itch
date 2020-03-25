import classNames from "classnames";
import _ from "lodash";
import React, {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
} from "react";
import { Button } from "renderer/basics/Button";
import { MenuContents, MenuTippy } from "renderer/basics/Menu";
import { useClickOutside } from "renderer/basics/useClickOutside";
import { buttonBorderRadius } from "renderer/theme";
import styled from "styled-components";

const DropdownContents = styled(MenuContents)`
  max-height: 400px;
  overflow-y: auto;
`;

export const DropdownButton = styled(Button)`
  padding: 0 12px;
  min-width: initial;

  &.group-start {
    border-radius: ${buttonBorderRadius}px 0 0 ${buttonBorderRadius}px;
  }

  &.group-middle {
    border-radius: 0;
  }

  &.group-start,
  &.group-middle {
    border-right: none;
  }

  &.group-end {
    border-radius: 0 ${buttonBorderRadius}px ${buttonBorderRadius}px 0;
  }
`;

export interface Option<T> {
  label: React.ReactNode;
  value: T;
}

export interface Props<T> {
  groupPosition?: "start" | "middle" | "end";
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  onChange: (value: T) => void;
  value: T;
  renderValue?: (value: Option<T>) => React.ReactNode;
  options: readonly Option<T>[];
  name?: string;
  className?: string;
  width?: number | string;
}

export const DropdownItem = styled.div`
  display: flex;
  align-items: center;

  > .spacer {
    flex-basis: 10px;
    flex-shrink: 0;
  }

  > .icon {
    min-width: 1em;
    flex-shrink: 0;

    &.hidden {
      visibility: hidden;
    }
  }

  > .filler {
    flex-basis: 10px;
    flex-shrink: 0;
    flex-grow: 1;
  }

  > .label {
    flex-grow: 1;
  }
`;

export const Dropdown = function<T>(props: Props<T>) {
  const [currentValue, setCurrentValue] = useState<T>(props.value);
  useEffect(() => {
    setCurrentValue(props.value);
  }, [props.value]);

  let shownOption =
    _.find(props.options, o => o.value === currentValue) ?? props.options[0];

  const [open, setOpen] = useState(false);
  const coref = useClickOutside(() => setOpen(false));

  let currentRef = useRef<HTMLButtonElement | null>(null);
  useLayoutEffect(() => {
    currentRef.current?.scrollIntoView({
      behavior: "auto",
      block: "nearest",
    });
    currentRef.current?.focus();
  });

  let keyDown = useCallback(
    (ev: React.KeyboardEvent<HTMLDivElement>) => {
      let valueIndex = _.findIndex(
        props.options,
        o => o.value === currentValue
      );

      if (ev.key === "ArrowDown") {
        let nextIndex = Math.min(valueIndex + 1, props.options.length - 1);
        let nextValue = props.options[nextIndex].value;
        setCurrentValue(nextValue);
        ev.preventDefault();
      } else if (ev.key === "ArrowUp") {
        let nextIndex = Math.max(valueIndex - 1, 0);
        let nextValue = props.options[nextIndex].value;
        setCurrentValue(nextValue);
        ev.preventDefault();
      } else if (ev.key === "Escape") {
        setCurrentValue(props.value);
        setOpen(false);
        ev.preventDefault();
      } else if (/[a-z]/.test(ev.key)) {
        let prefix = ev.key;

        let labelStartsWith = (o: Option<T>, prefix: string): boolean => {
          let label = typeof o.label === "string" ? o.label : `${o.value}`;
          return label.toLowerCase().startsWith(prefix);
        };
        let nextValue =
          _.find(props.options, (o, index) => {
            if (index <= valueIndex) {
              return false;
            }
            return labelStartsWith(o, prefix);
          }) ??
          _.find(props.options, (o, index) => {
            return labelStartsWith(o, prefix);
          });
        if (nextValue) {
          setCurrentValue(nextValue.value);
        }
      }
    },
    [currentValue, props.options, props.value]
  );

  return (
    <MenuTippy
      visible={open}
      interactive
      placement="bottom"
      appendTo={document.body}
      boundary="viewport"
      maxWidth={props.width}
      content={
        <DropdownContents
          style={{ width: props.width ?? 180 }}
          className={"dropdown-options"}
          data-name={props.name}
          ref={coref("menu-contents")}
          onKeyDown={keyDown}
        >
          {props.options.map(({ value, label }) => {
            return (
              <DropdownButton
                key={`${value}`}
                className={classNames("dropdown-option", {
                  highlighted: currentValue == value,
                })}
                data-value={`${value}`}
                onClick={() => {
                  props.onChange(value);
                  setOpen(false);
                }}
                ref={open && currentValue === value ? currentRef : null}
                label={
                  <DropdownItem>
                    <span
                      className={classNames("label", {
                        active: props.value === value,
                      })}
                    >
                      {label}
                    </span>
                    <div className="filler" />
                  </DropdownItem>
                }
              />
            );
          })}
        </DropdownContents>
      }
    >
      <DropdownButton
        lefty
        className={classNames(
          "dropdown",
          props.className,
          props.groupPosition ? `group-${props.groupPosition}` : null
        )}
        style={{ width: props.width ?? "initial" }}
        data-name={props.name}
        secondary
        ref={coref("button")}
        onClick={() => setOpen(open => !open)}
        label={
          <DropdownItem>
            {props.prefix}
            {props.renderValue
              ? props.renderValue(shownOption)
              : shownOption?.label}
            {props.suffix}
          </DropdownItem>
        }
      />
    </MenuTippy>
  );
};
