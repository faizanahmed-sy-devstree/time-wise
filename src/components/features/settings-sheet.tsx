
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/ui/icons';

interface SettingsSheetProps {
  settings: {
    fullDayHours: string;
    fullDayMinutes: string;
    apiKey: string;
  };
  onSettingsChange: (settings: any) => void;
  onSave: () => boolean;
}

export function SettingsSheet({ settings, onSettingsChange, onSave }: SettingsSheetProps) {
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'apiKey') {
        onSettingsChange((prev: any) => ({ ...prev, [name]: value }));
    } else if (/^\d*$/.test(value)) {
        onSettingsChange((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveAndClose = () => {
    if(onSave()){
        setIsSettingsSheetOpen(false);
    }
  }

  return (
    <Sheet open={isSettingsSheetOpen} onOpenChange={setIsSettingsSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Icons.Cog className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader>
          <SheetTitle>Settings & About</SheetTitle>
          <SheetDescription>Manage your preferences and learn more about TimeWise.</SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="settings" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          <TabsContent value="settings">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullDayHours-settings">Full Workday</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="fullDayHours-settings"
                    name="fullDayHours"
                    type="text"
                    placeholder="Hours"
                    value={settings.fullDayHours || ''}
                    onChange={handleSettingsChange}
                  />
                  <Input
                    id="fullDayMinutes-settings"
                    name="fullDayMinutes"
                    type="text"
                    placeholder="Minutes"
                    value={settings.fullDayMinutes || ''}
                    onChange={handleSettingsChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey-settings">Gemini API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey-settings"
                    name="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="Your Gemini API Key"
                    value={settings.apiKey || ''}
                    onChange={handleSettingsChange}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <Icons.EyeOff className="h-5 w-5" /> : <Icons.Eye className="h-5 w-5" />}
                    <span className="sr-only">{showApiKey ? 'Hide API Key' : 'Show API Key'}</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  You can get your free API key from{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary hover:text-primary/80"
                  >
                    Google AI Studio
                  </a>.
                </p>
              </div>
            </div>
            <Button onClick={handleSaveAndClose} className="w-full">
              Save Changes
            </Button>
          </TabsContent>
          <TabsContent value="about">
            <div className="py-4 text-sm text-foreground space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg font-headline">The Human Behind the Curtain</h3>
                <p>
                  Hey there! I'm <span className="font-bold text-primary">Mitul Parmar</span>, a Python backend and AI/ML
                  developer with a knack for building cool things. I also know my way around a Nest.js backend and a React
                  front-end.
                </p>
                <p>
                  I live for backend logic and AI models — the serious, sensible part of the stack. Front-end? That’s where
                  things get weird. I don’t usually mess with pixels and padding, but I let an AI drag me through it.
                  Somehow, we survived — and yes, every button that looks slightly off is probably AI’s fault. Or mine.
                  Probably both.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg font-headline">About the Project</h3>
                <p>
                  Think of TimeWise as a grand experiment. What happens when a developer teams up with an AI? This project
                  is the answer. About 90% of the code you see was generated by an AI, guided by my prompts. The other 10%
                  is me fixing the weird stuff the AI does.
                </p>
                <p>
                  This app is <span className="font-semibold">100% client-side</span>, meaning all your data stays right
                  here in your browser. It's also open source, so feel free to peek at the code, suggest changes, or just
                  marvel at what a human-AI pair can build.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg font-headline">Connect & Contribute</h3>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="w-full">
                    <a href="https://www.linkedin.com/in/mitulparmar11/" target="_blank" rel="noopener noreferrer">
                      <Icons.Linkedin className="mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <a href="https://github.com/mitulparmar7161/time-wise.git" target="_blank" rel="noopener noreferrer">
                      <Icons.Github className="mr-2" />
                      GitHub
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

    