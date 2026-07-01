import { Profile } from "@shared/schema";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteUserDialog } from "./DeleteUserDialog";

export function UserActionsDropdown({
  profile,
  onToggleSubscriber,
  onDelete,
}: {
  profile: Profile;
  onToggleSubscriber: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={4}
        className="min-w-[190px] rounded-lg border-sidebar-border bg-sidebar p-1 text-sidebar-foreground"
      >
        <DropdownMenuLabel className="px-2 py-1 text-xs text-sidebar-foreground/80">
          Actions utilisateur
        </DropdownMenuLabel>
        <div className="my-1 h-px bg-sidebar-border/70" />
        <DropdownMenuItem
          onClick={onToggleSubscriber}
          className="h-9 cursor-pointer rounded-md px-2 text-sm font-medium data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground focus:bg-sidebar-accent focus:text-sidebar-accent-foreground"
        >
          {profile.is_subscriber ? "Retirer abonné" : "Passer abonné"}
        </DropdownMenuItem>
        <DeleteUserDialog profile={profile} onDelete={onDelete} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
