import React, { useState, useRef } from 'react';
import { Check, Copy, Code, Eye, Images, Link, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Editor } from '@tinymce/tinymce-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/lib/api';
import { EmailTemplate } from '@/types/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface NewTemplateFormProps {
  onSubmit: () => void;
  existingTemplate?: EmailTemplate;
}

const placeholders = [
  { name: 'First Name', value: '{{.FirstName}}', description: 'Recipient\'s first name' },
  { name: 'Last Name', value: '{{.LastName}}', description: 'Recipient\'s last name' },
  { name: 'Email', value: '{{.Email}}', description: 'Recipient\'s email address' },
  { name: 'Position', value: '{{.Position}}', description: 'Recipient\'s job position' },
  { name: 'Company', value: '{{.Company}}', description: 'Company name' },
  { name: 'URL', value: '{{.URL}}', description: 'Phishing URL with tracking' },
  { name: 'From', value: '{{.From}}', description: 'Sender\'s name and email' },
  { name: 'TrackingImage', value: '{{.Tracker}}', description: 'Email open tracking image' },
];

const NewTemplateForm: React.FC<NewTemplateFormProps> = ({ 
  onSubmit,
  existingTemplate
}) => {
  const queryClient = useQueryClient();
  const editorRef = useRef<any>(null);
  const isEditing = !!existingTemplate;
  
  const [activeTab, setActiveTab] = useState('design');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [placeholderDialogOpen, setPlaceholderDialogOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({
    name: existingTemplate?.name || '',
    subject: existingTemplate?.subject || '',
    text: existingTemplate?.text || '',
    html: existingTemplate?.html || '<p>Write your email content here...</p>',
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Create/update template mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<EmailTemplate>) => {
      if (isEditing && existingTemplate?.id) {
        return apiService.updateTemplate(existingTemplate.id, data);
      } else {
        return apiService.createTemplate(data);
      }
    },
    onSuccess: () => {
      toast.success(
        isEditing ? 'Template updated successfully' : 'Template created successfully'
      );
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      onSubmit();
    },
    onError: (error) => {
      toast.error('Failed to save template', {
        description: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  });

  // Generate plain text from HTML
  const generateTextFromHtml = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle editor content change
  const handleEditorChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.getContent();
      setFormData((prev) => ({
        ...prev,
        html: content,
        text: generateTextFromHtml(content)
      }));
    }
  };

  // Handle HTML code direct edits
  const handleHtmlCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const html = e.target.value;
    setFormData((prev) => ({
      ...prev,
      html,
      text: generateTextFromHtml(html)
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Template name is required';
    }
    
    if (!formData.subject?.trim()) {
      newErrors.subject = 'Email subject is required';
    }
    
    if (!formData.html || formData.html === '<p></p>') {
      newErrors.html = 'Email content is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Make sure we have the latest content from the editor
      if (editorRef.current && activeTab === 'design') {
        const content = editorRef.current.getContent();
        formData.html = content;
        formData.text = generateTextFromHtml(content);
      }
      
      saveMutation.mutate(formData);
    }
  };

  // Insert placeholder
  const insertPlaceholder = (placeholder: string) => {
    if (editorRef.current) {
      editorRef.current.execCommand('mceInsertContent', false, placeholder);
      setPlaceholderDialogOpen(false);
    }
  };

  // Generate email preview
  const refreshPreview = () => {
    setPreviewLoading(true);
    
    // Save current content
    if (editorRef.current && activeTab === 'design') {
      const content = editorRef.current.getContent();
      setFormData((prev) => ({
        ...prev,
        html: content
      }));
    }
    
    // Simulate loading delay
    setTimeout(() => {
      setPreviewLoading(false);
    }, 500);
  };

  // Copy HTML to clipboard
  const copyHtmlToClipboard = () => {
    navigator.clipboard.writeText(formData.html || '');
    toast.success('HTML copied to clipboard');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input 
            id="name" 
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., IT Security Policy Update" 
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
        </div>
        <div>
          <Label htmlFor="subject">Email Subject</Label>
          <Input 
            id="subject" 
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="e.g., Important: Security Policy Update Required" 
            className={errors.subject ? 'border-destructive' : ''}
          />
          {errors.subject && <p className="text-destructive text-sm mt-1">{errors.subject}</p>}
        </div>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-muted/30 px-4 pt-3">
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="code">HTML</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="design" className="p-4">
            <div className="space-y-4">
              <Editor
                apiKey="your-tinymce-api-key" // Get a free API key from TinyMCE
                onInit={(evt, editor) => editorRef.current = editor}
                initialValue={formData.html}
                onEditorChange={handleEditorChange}
                init={{
                  height: 400,
                  menubar: true,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
                  ],
                  toolbar: 'undo redo | blocks | ' +
                    'bold italic forecolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | help',
                  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                  branding: false,
                  elementpath: false
                }}
              />
              
              {errors.html && <p className="text-destructive text-sm mt-1">{errors.html}</p>}
              
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setImageDialogOpen(true)}>
                  <Images className="mr-2 h-4 w-4" />
                  Add Image
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setLinkDialogOpen(true)}>
                  <Link className="mr-2 h-4 w-4" />
                  Add Link
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setPlaceholderDialogOpen(true)}>
                  <Code className="mr-2 h-4 w-4" />
                  Add Placeholder
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="code" className="p-4">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={copyHtmlToClipboard}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy HTML
                </Button>
              </div>
              <Textarea 
                value={formData.html || ''}
                onChange={handleHtmlCodeChange}
                placeholder="<!DOCTYPE html><html><head>...</head><body>...</body></html>" 
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="p-4">
            <div className="flex justify-end mb-4">
              <Button type="button" size="sm" variant="outline" onClick={refreshPreview}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Preview
              </Button>
            </div>
            
            {previewLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <Card className="p-4 min-h-[400px]">
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <div className="text-sm font-medium">From: {formData.name || 'Sender'}</div>
                    <div className="text-sm font-medium">Subject: {formData.subject || 'Subject'}</div>
                  </div>
                  <div 
                    className="text-sm email-preview"
                    dangerouslySetInnerHTML={{ __html: formData.html || '' }}
                  />
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" type="button" onClick={onSubmit}>
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isEditing ? 'Update Template' : 'Save Template'}
        </Button>
      </div>

      {/* Add Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
            <DialogDescription>
              Insert an image into your email template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input id="image-url" placeholder="https://example.com/image.jpg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-alt">Alt Text</Label>
              <Input id="image-alt" placeholder="Description of the image" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-width">Width (optional)</Label>
              <Input id="image-width" placeholder="e.g., 300 or 100%" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => {
              const url = (document.getElementById('image-url') as HTMLInputElement).value;
              const alt = (document.getElementById('image-alt') as HTMLInputElement).value;
              const width = (document.getElementById('image-width') as HTMLInputElement).value;
              
              if (!url) {
                toast.error("Image URL is required");
                return;
              }
              
              if (editorRef.current) {
                const widthAttr = width ? ` width="${width}"` : '';
                editorRef.current.execCommand('mceInsertContent', false, 
                  `<img src="${url}" alt="${alt}"${widthAttr} />`
                );
                toast.success("Image added to template");
                setImageDialogOpen(false);
              }
            }}>
              Insert Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
            <DialogDescription>
              Insert a link into your email template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input id="link-url" placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-text">Link Text</Label>
              <Input id="link-text" placeholder="Click here" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-title">Title (optional)</Label>
              <Input id="link-title" placeholder="Additional information on hover" />
            </div>
            <Alert variant="default" className="mt-2">
              <AlertDescription>
                Tip: Use &#123;&#123;.URL&#125;&#125; as the link target to automatically track clicks.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => {
              const url = (document.getElementById('link-url') as HTMLInputElement).value;
              const text = (document.getElementById('link-text') as HTMLInputElement).value;
              const title = (document.getElementById('link-title') as HTMLInputElement).value;
              
              if (!url) {
                toast.error("URL is required");
                return;
              }
              
              if (editorRef.current) {
                const titleAttr = title ? ` title="${title}"` : '';
                editorRef.current.execCommand('mceInsertContent', false, 
                  `<a href="${url}"${titleAttr}>${text || url}</a>`
                );
                toast.success("Link added to template");
                setLinkDialogOpen(false);
              }
            }}>
              Insert Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Placeholder Dialog */}
      <Dialog open={placeholderDialogOpen} onOpenChange={setPlaceholderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Placeholder</DialogTitle>
            <DialogDescription>
              Insert a dynamic placeholder that will be replaced with actual data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4">
              {placeholders.map((placeholder) => (
                <Button 
                  key={placeholder.value} 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => insertPlaceholder(placeholder.value)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{placeholder.name}</span>
                    <span className="text-xs text-muted-foreground">{placeholder.description}</span>
                    <code className="mt-1 text-xs bg-muted px-1 py-0.5 rounded">{placeholder.value}</code>
                  </div>
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default NewTemplateForm;
