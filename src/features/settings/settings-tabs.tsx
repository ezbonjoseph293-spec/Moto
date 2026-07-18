"use client";

import Link from "next/link";
import type { Menu, Testimonial, UserRole } from "@prisma/client";
import { ArrowRight } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SerializedSetting } from "./schema";
import { IdentityForm } from "./identity-form";
import { HomepageContentForm } from "./homepage-content-form";
import { ContactForm } from "./contact-form";
import { DepositForm } from "./deposit-form";
import { AnnouncementForm } from "./announcement-form";
import { NotificationsForm } from "./notifications-form";
import { MenuManager } from "./menu-manager";
import { TestimonialManager } from "./testimonial-manager";

export function SettingsTabs({
  setting,
  headerMenu,
  footerMenu,
  testimonials,
  role,
}: {
  setting: SerializedSetting;
  headerMenu: Menu[];
  footerMenu: Menu[];
  testimonials: Testimonial[];
  role: UserRole;
}) {
  return (
    <Tabs defaultValue="branding">
      <TabsList className="flex-wrap">
        <TabsTrigger value="branding">Branding</TabsTrigger>
        <TabsTrigger value="homepage">Homepage content</TabsTrigger>
        <TabsTrigger value="contact">Contact</TabsTrigger>
        <TabsTrigger value="navigation">Navigation</TabsTrigger>
        <TabsTrigger value="announcement">Announcement</TabsTrigger>
        <TabsTrigger value="deposit">Deposit policy</TabsTrigger>
        <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
        <TabsTrigger value="content">Pages &amp; team</TabsTrigger>
      </TabsList>

      <TabsContent value="branding">
        <IdentityForm setting={setting} />
      </TabsContent>
      <TabsContent value="homepage">
        <HomepageContentForm setting={setting} />
      </TabsContent>
      <TabsContent value="contact">
        <ContactForm setting={setting} />
      </TabsContent>
      <TabsContent value="navigation">
        <MenuManager header={headerMenu} footer={footerMenu} />
      </TabsContent>
      <TabsContent value="announcement">
        <AnnouncementForm setting={setting} />
      </TabsContent>
      <TabsContent value="deposit" className="space-y-6">
        <DepositForm setting={setting} />
        <NotificationsForm setting={setting} />
      </TabsContent>
      <TabsContent value="testimonials">
        <TestimonialManager testimonials={testimonials} />
      </TabsContent>
      <TabsContent value="content" className="max-w-xl space-y-3">
        <Link
          href="/admin/settings/pages"
          className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 hover:bg-muted"
        >
          <div>
            <p className="text-sm font-medium text-ink">Pages &amp; policies</p>
            <p className="text-xs text-muted-foreground">
              Edit the about page and privacy, terms, warranty, returns, and financing policies.
            </p>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
        </Link>
        {role === "OWNER" && (
          <Link
            href="/admin/settings/team"
            className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 hover:bg-muted"
          >
            <div>
              <p className="text-sm font-medium text-ink">Team</p>
              <p className="text-xs text-muted-foreground">
                Invite staff, manage roles, and review activity.
              </p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
          </Link>
        )}
      </TabsContent>
    </Tabs>
  );
}
