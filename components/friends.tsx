"use client";

import { Users } from "lucide-react";

export default function Friends() {
  return (
    <div className="space-y-4">
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-3">
          Feature will be out soon.
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Connect with friends to share recipes and discover new favorites
          together!
        </p>
      </div>
    </div>
  );
}
