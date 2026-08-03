import { SidebarTeamSkeleton } from "@/components/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type TeamSwitcherProps = {
  isLoading?: boolean;
};

const BRAND_NAME = "LobbyStack";

export function TeamSwitcher({ isLoading = false }: TeamSwitcherProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {isLoading ? (
          <div className="flex h-12 items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <Skeleton className="size-8 rounded-xl" />
            <Skeleton className="h-6 w-32 max-w-full group-data-[collapsible=icon]:hidden" />
          </div>
        ) : (
          <SidebarMenuButton
            aria-label={BRAND_NAME}
            className="gap-1.5"
            size="lg"
          >
            {/* No mark and no wordmark. This is one tool inside another product,
                and a logo here would announce a vendor the user never chose. */}
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
