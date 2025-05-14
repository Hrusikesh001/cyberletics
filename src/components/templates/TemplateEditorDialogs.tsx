
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Link, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface TemplateEditorDialogsProps {
  onInsertImage?: (imageUrl: string, altText: string) => void;
  onInsertLink?: (url: string, text: string, title?: string) => void;
  onInsertTrackingPixel?: (id: string) => void;
}

export const TemplateEditorDialogs: React.FC<TemplateEditorDialogsProps> = ({
  onInsertImage = () => {},
  onInsertLink = () => {},
  onInsertTrackingPixel = () => {}
}) => {
  // Image dialog state
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  
  // Link dialog state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  
  // Tracking pixel state
  const [trackingId, setTrackingId] = useState('');
  
  const handleInsertImage = (close: () => void) => {
    if (!imageUrl) {
      toast.error("Image URL is required");
      return;
    }
    
    onInsertImage(imageUrl, imageAlt);
    setImageUrl('');
    setImageAlt('');
    close();
    toast.success("Image inserted");
  };
  
  const handleInsertLink = (close: () => void) => {
    if (!linkUrl) {
      toast.error("Link URL is required");
      return;
    }
    
    onInsertLink(linkUrl, linkText || linkUrl, linkTitle);
    setLinkUrl('');
    setLinkText('');
    setLinkTitle('');
    close();
    toast.success("Link inserted");
  };
  
  const handleInsertTrackingPixel = (close: () => void) => {
    if (!trackingId) {
      toast.error("Tracking ID is required");
      return;
    }
    
    onInsertTrackingPixel(trackingId);
    setTrackingId('');
    close();
    toast.success("Tracking pixel inserted");
  };
  
  return (
    <div className="flex space-x-2">
      {/* Image Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Image size={16} className="mr-2" />
            Add Image
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogDescription>
              Add an image to your template
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="alt-text">Alt Text</Label>
              <Input
                id="alt-text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Description of the image"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button onClick={(e) => {
                e.preventDefault();
                handleInsertImage(() => {}); // We don't need to call close as the DialogClose will handle it
              }}>Insert Image</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Link Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Link size={16} className="mr-2" />
            Add Link
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
            <DialogDescription>
              Add a hyperlink to your template
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link-text">Link Text</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Click here"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link-title">Title (Optional)</Label>
              <Input
                id="link-title"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Additional information"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button onClick={(e) => {
                e.preventDefault();
                handleInsertLink(() => {}); // We don't need to call close as the DialogClose will handle it
              }}>Insert Link</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Tracking Pixel Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Eye size={16} className="mr-2" />
            Add Tracking Pixel
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Tracking Pixel</DialogTitle>
            <DialogDescription>
              Add an invisible tracking pixel to your template
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tracking-id">Tracking ID</Label>
              <Input
                id="tracking-id"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="unique-tracking-id"
              />
              <p className="text-sm text-muted-foreground">
                This ID will be used to identify when the email is opened
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button onClick={(e) => {
                e.preventDefault();
                handleInsertTrackingPixel(() => {}); // We don't need to call close as the DialogClose will handle it
              }}>Insert Tracking Pixel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
