"use client";

import type { Menu, Setting } from "@prisma/client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IdentityForm } from "./identity-form";
import { ContactForm } from "./contact-form";
import { DepositForm } from "./deposit-form";
import { AnnouncementForm } from "./announcement-form";
import { MenuManager } from "./menu-manager";

export function SettingsTabs({
  setting,
  headerMenu,
  footerMenu,
}: {
  setting: Setting;
  headerMenu: Menu[];
  footerMenu: Menu[];
}) {
  return (
    <Tabs defaultValue="branding">
      <TabsList>
        <TabsTrigger value="branding">Branding</TabsTrigger>
        <TabsTrigger value="contact">Contact</TabsTrigger>
        <TabsTrigger value="navigation">Navigation</TabsTrigger>
        <TabsTrigger value="announcement">Announcement</TabsTrigger>
        <TabsTrigger value="deposit">Deposit policy</TabsTrigger>
      </TabsList>

      <TabsContent value="branding">
        <IdentityForm setting={setting} />
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
      <TabsContent value="deposit">
        <DepositForm setting={setting} />
      </TabsContent>
    </Tabs>
  );
}
