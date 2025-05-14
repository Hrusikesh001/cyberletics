import React, { useState, useRef } from 'react';
import { Save, Copy, RefreshCw, Code, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Editor } from '@tinymce/tinymce-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/lib/api';
import { LandingPage } from '@/types/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

interface LandingPageFormProps {
  onSubmit: () => void;
  existingPage?: LandingPage;
}

// Form field placeholders for credentials
const FORM_FIELD_SNIPPETS = [
  {
    name: 'Email Username Field',
    value: '<input type="text" name="username" id="username" placeholder="Email or Username" class="w-full px-3 py-2 border rounded mb-2">',
    description: 'Input field for capturing usernames'
  },
  {
    name: 'Password Field',
    value: '<input type="password" name="password" id="password" placeholder="Password" class="w-full px-3 py-2 border rounded mb-3">',
    description: 'Input field for capturing passwords'
  },
  {
    name: 'Submit Button',
    value: '<button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Sign In</button>',
    description: 'Form submission button'
  },
  {
    name: 'Basic Login Form',
    value: `<form method="post" id="login-form" class="p-4 w-full max-w-sm mx-auto border rounded shadow-md">
  <div class="mb-4">
    <label for="username" class="block text-sm font-medium mb-1">Email or Username</label>
    <input type="text" name="username" id="username" class="w-full px-3 py-2 border rounded" required>
  </div>
  <div class="mb-4">
    <label for="password" class="block text-sm font-medium mb-1">Password</label>
    <input type="password" name="password" id="password" class="w-full px-3 py-2 border rounded" required>
  </div>
  <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Sign In</button>
</form>`,
    description: 'Complete login form with labels and styling'
  }
];

const LandingPageForm: React.FC<LandingPageFormProps> = ({ 
  onSubmit,
  existingPage
}) => {
  const queryClient = useQueryClient();
  const editorRef = useRef<any>(null);
  const isEditing = !!existingPage;

  const [activeTab, setActiveTab] = useState('design');
  const [formSnippetDialogOpen, setFormSnippetDialogOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<LandingPage>>({
    name: existingPage?.name || '',
    html: existingPage?.html || '<div class="container mx-auto p-4"><h1 class="text-2xl font-bold mb-4">Login Required</h1><p class="mb-4">Please login to continue to the secure document.</p></div>',
    capture_credentials: existingPage?.capture_credentials ?? true,
    capture_passwords: existingPage?.capture_passwords ?? true,
    redirect_url: existingPage?.redirect_url || 'https://example.com',
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Create/update landing page mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<LandingPage>) => {
      if (isEditing && existingPage?.id) {
        return apiService.updateLandingPage(existingPage.id, data);
      } else {
        return apiService.createLandingPage(data);
      }
    },
    onSuccess: () => {
      toast.success(
        isEditing ? 'Landing page updated successfully' : 'Landing page created successfully'
      );
      queryClient.invalidateQueries({ queryKey: ['landingPages'] });
      onSubmit();
    },
    onError: (error) => {
      toast.error('Failed to save landing page', {
        description: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  });

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

  // Handle checkbox changes
  const handleCheckboxChange = (name: keyof LandingPage, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle editor content change
  const handleEditorChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.getContent();
      setFormData((prev) => ({
        ...prev,
        html: content
      }));
    }
  };

  // Handle HTML code direct edits
  const handleHtmlCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const html = e.target.value;
    setFormData((prev) => ({
      ...prev,
      html
    }));
  };

  // Insert code snippet
  const insertCodeSnippet = (snippet: string) => {
    if (editorRef.current) {
      editorRef.current.execCommand('mceInsertContent', false, snippet);
      setFormSnippetDialogOpen(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Page name is required';
    }
    
    if (!formData.html || formData.html === '<p></p>') {
      newErrors.html = 'Page content is required';
    }

    if (formData.capture_credentials && !formData.redirect_url?.trim()) {
      newErrors.redirect_url = 'Redirect URL is required when capturing credentials';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generate page preview
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

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Make sure we have the latest content from the editor
      if (editorRef.current && activeTab === 'design') {
        const content = editorRef.current.getContent();
        formData.html = content;
      }
      
      saveMutation.mutate(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Page Name</Label>
          <Input 
            id="name" 
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Office 365 Login" 
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
        </div>
        <div>
          <Label htmlFor="redirect_url">Redirect URL (after form submission)</Label>
          <Input 
            id="redirect_url" 
            name="redirect_url"
            value={formData.redirect_url}
            onChange={handleChange}
            placeholder="e.g., https://office.com" 
            className={errors.redirect_url ? 'border-destructive' : ''}
          />
          {errors.redirect_url && <p className="text-destructive text-sm mt-1">{errors.redirect_url}</p>}
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="capture_credentials" 
            checked={formData.capture_credentials}
            onCheckedChange={(checked) => handleCheckboxChange('capture_credentials', !!checked)}
          />
          <Label htmlFor="capture_credentials" className="font-normal">
            Capture form credentials
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="capture_passwords" 
            checked={formData.capture_passwords}
            disabled={!formData.capture_credentials}
            onCheckedChange={(checked) => handleCheckboxChange('capture_passwords', !!checked)}
          />
          <Label 
            htmlFor="capture_passwords" 
            className={`font-normal ${!formData.capture_credentials ? 'text-muted-foreground' : ''}`}
          >
            Capture passwords
          </Label>
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
              <Alert variant="default">
                <AlertDescription>
                  {formData.capture_credentials ? (
                    <>
                      <strong>Form Credential Capture Enabled:</strong> Make sure your landing page includes a form with input fields named "username" and{formData.capture_passwords ? ' "password"' : ''}.
                    </>
                  ) : (
                    <>
                      <strong>Credential Capture Disabled:</strong> This page will only track visits but won't capture form submissions.
                    </>
                  )}
                </AlertDescription>
              </Alert>

              <Editor
                apiKey="your-tinymce-api-key" // Get a free API key from TinyMCE
                onInit={(evt, editor) => editorRef.current = editor}
                initialValue={formData.html}
                onEditorChange={handleEditorChange}
                init={{
                  height: 500,
                  menubar: true,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
                  ],
                  toolbar: 'undo redo | blocks | ' +
                    'bold italic forecolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | code | help',
                  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                  branding: false,
                  elementpath: false
                }}
              />
              
              {errors.html && <p className="text-destructive text-sm mt-1">{errors.html}</p>}
              
              <div className="flex flex-wrap gap-2 justify-between">
                <div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setFormSnippetDialogOpen(true)}
                    disabled={!formData.capture_credentials}
                  >
                    <Code className="mr-2 h-4 w-4" />
                    Add Form Snippet
                  </Button>
                </div>

                <div>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => {
                      if (confirm('This will reset your current design. Are you sure?')) {
                        if (editorRef.current) {
                          // Insert a basic login page template
                          editorRef.current.setContent(`
                            <div class="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                              <div class="sm:mx-auto sm:w-full sm:max-w-md">
                                <h2 class="text-center text-3xl font-bold text-gray-900">
                                  Sign in to your account
                                </h2>
                              </div>
                              <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                                <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                                  <form class="space-y-6" action="#" method="POST">
                                    <div>
                                      <label for="username" class="block text-sm font-medium text-gray-700">
                                        Email address
                                      </label>
                                      <div class="mt-1">
                                        <input id="username" name="username" type="email" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                      </div>
                                    </div>
                                    <div>
                                      <label for="password" class="block text-sm font-medium text-gray-700">
                                        Password
                                      </label>
                                      <div class="mt-1">
                                        <input id="password" name="password" type="password" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                      </div>
                                    </div>
                                    <div class="flex items-center justify-between">
                                      <div class="flex items-center">
                                        <input id="remember-me" name="remember-me" type="checkbox" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                        <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                                          Remember me
                                        </label>
                                      </div>
                                      <div class="text-sm">
                                        <a href="#" class="font-medium text-blue-600 hover:text-blue-500">
                                          Forgot your password?
                                        </a>
                                      </div>
                                    </div>
                                    <div>
                                      <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                        Sign in
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              </div>
                            </div>
                          `);

                          // Update form data
                          const content = editorRef.current.getContent();
                          setFormData((prev) => ({
                            ...prev,
                            html: content
                          }));

                          toast.success('Template applied');
                        }
                      }
                    }}
                  >
                    Apply Login Template
                  </Button>
                </div>
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
                className="min-h-[500px] font-mono text-sm"
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
              <Card className="overflow-hidden">
                <div className="bg-gray-200 text-xs p-2 border-b flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 text-center">{formData.redirect_url || 'example.com'}</div>
                  <div className="w-4"></div>
                </div>
                <div className="p-4 min-h-[500px] bg-white border landing-page-preview">
                  <div 
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
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isEditing ? 'Update Page' : 'Save Page'}
        </Button>
      </div>

      {/* Code Snippets Dialog */}
      <Dialog open={formSnippetDialogOpen} onOpenChange={setFormSnippetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Form Snippet</DialogTitle>
            <DialogDescription>
              Insert common form elements for credential capture.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4">
              {FORM_FIELD_SNIPPETS.map((snippet) => (
                <Button 
                  key={snippet.name}
                  variant="outline" 
                  className="justify-start h-auto py-3"
                  onClick={() => insertCodeSnippet(snippet.value)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{snippet.name}</span>
                    <span className="text-xs text-muted-foreground">{snippet.description}</span>
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

export default LandingPageForm;

 