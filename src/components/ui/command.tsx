import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group"
import { SearchIcon, CheckIcon, SearchXIcon, XIcon } from "lucide-react"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-xl! bg-popover p-1 text-popover-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  className?: string
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex h-[28rem] max-h-[85vh] flex-col overflow-hidden rounded-xl! p-0 sm:max-w-xl",
          className
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  value: valueProp,
  onValueChange,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  const [internalValue, setInternalValue] = React.useState(
    (valueProp as string | undefined) ?? ""
  )
  const isControlled = valueProp !== undefined
  const value = isControlled ? (valueProp as string) : internalValue
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleValueChange = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next)
      onValueChange?.(next)
    },
    [isControlled, onValueChange]
  )

  const handleClear = React.useCallback(() => {
    handleValueChange("")
    inputRef.current?.focus()
  }, [handleValueChange])

  React.useEffect(() => {
    const node = inputRef.current
    if (!node) return
    const onKeyDownCapture = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (node.value.length === 0) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      handleValueChange("")
    }
    node.addEventListener("keydown", onKeyDownCapture, { capture: true })
    return () =>
      node.removeEventListener(
        "keydown",
        onKeyDownCapture,
        { capture: true } as EventListenerOptions
      )
  }, [handleValueChange])

  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="h-10! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:pl-2.5! *:data-[slot=input-group-addon]:pr-2.5!">
        <CommandPrimitive.Input
          ref={inputRef}
          data-slot="command-input"
          value={value}
          onValueChange={handleValueChange}
          className={cn(
            "w-full px-2.5 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <InputGroupAddon align="inline-start" aria-hidden="true">
          <SearchIcon className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
        {value.length > 0 ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label="Clear search"
              onClick={handleClear}
              onMouseDown={(e) => e.preventDefault()}
            >
              <XIcon className="size-3.5" />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "flex-1 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none [scrollbar-gutter:stable]",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn(
        "flex min-h-[16rem] flex-col items-center justify-center gap-3 px-6 py-10 text-center",
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <SearchXIcon className="size-5" />
          </span>
          <p className="text-sm font-medium text-foreground">No results</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Try a different search term.
          </p>
        </>
      )}
    </CommandPrimitive.Empty>
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-foreground",
        className
      )}
      {...props}
    >
      {children}
      <CheckIcon className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
