
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: {
    fullDayHours: string;
    fullDayMinutes: string;
    apiKey: string;
  };
  onSettingsChange: (settings: any) => void;
  onSave: () => boolean;
}

export function WelcomeDialog({ open, onOpenChange, settings, onSettingsChange, onSave }: WelcomeDialogProps) {
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
        onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Welcome to TimeWise!</DialogTitle>
          <DialogDescription>
            Let's get you set up. Configure your workday and provide your Gemini API key to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullDayHours-welcome">Full Workday</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="fullDayHours-welcome"
                name="fullDayHours"
                type="text"
                placeholder="Hours"
                value={settings.fullDayHours || ''}
                onChange={handleSettingsChange}
              />
              <Input
                id="fullDayMinutes-welcome"
                name="fullDayMinutes"
                type="text"
                placeholder="Minutes"
                value={settings.fullDayMinutes || ''}
                onChange={handleSettingsChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey-welcome">Gemini API Key</Label>
            <div className="relative">
              <Input
                id="apiKey-welcome"
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
            <p className="text-xs text-muted-foreground">
              Get your free API key from{' '}
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
        <DialogFooter>
          <Button onClick={handleSaveAndClose} className="w-full">
            Save and Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    