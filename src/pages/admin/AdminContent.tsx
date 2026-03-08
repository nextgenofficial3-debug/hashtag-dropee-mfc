import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Image, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSiteContent, useUpdateSiteContent, SiteContent } from '@/hooks/useSiteContent';
import { useImageUpload } from '@/hooks/useImageUpload';
import AdminSidebar from '@/components/admin/AdminSidebar';

const AdminContent: React.FC = () => {
  const { data: allContent, isLoading } = useSiteContent();
  const updateContent = useUpdateSiteContent();
  const { uploadImage, isUploading } = useImageUpload();

  const [aboutForm, setAboutForm] = useState({
    title: '',
    content: '',
    image_url: '',
  });

  const [contactForm, setContactForm] = useState({
    title: '',
    content: '',
    address: '',
    email: '',
    phone_1: '',
    phone_2: '',
    map_embed_url: '',
    directions_url: '',
    image_url: '',
  });

  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (allContent && Array.isArray(allContent)) {
      const aboutData = allContent.find((c: SiteContent) => c.section === 'about');
      const contactData = allContent.find((c: SiteContent) => c.section === 'contact');

      if (aboutData) {
        setAboutForm({
          title: aboutData.title || '',
          content: aboutData.content || '',
          image_url: aboutData.image_url || '',
        });
      }

      if (contactData) {
        setContactForm({
          title: contactData.title || '',
          content: contactData.content || '',
          address: contactData.address || '',
          email: contactData.email || '',
          phone_1: contactData.phone_1 || '',
          phone_2: contactData.phone_2 || '',
          map_embed_url: contactData.map_embed_url || '',
          directions_url: (contactData as any).directions_url || '',
          image_url: contactData.image_url || '',
        });
      }
    }
  }, [allContent]);

  const handleAboutSave = () => {
    updateContent.mutate({
      section: 'about',
      updates: aboutForm,
    });
  };

  const handleContactSave = () => {
    updateContent.mutate({
      section: 'contact',
      updates: contactForm,
    });
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    section: 'about' | 'contact'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file);
    if (url) {
      if (section === 'about') {
        setAboutForm((prev) => ({ ...prev, image_url: url }));
      } else {
        setContactForm((prev) => ({ ...prev, image_url: url }));
      }
    }
  };

  if (isLoading) {
    return (
      <AdminSidebar>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminSidebar>
    );
  }

  return (
    <AdminSidebar>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Site Content</h1>
            <p className="text-muted-foreground">Manage your About and Contact pages</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>

        <Tabs defaultValue="about" className="space-y-6">
          <TabsList>
            <TabsTrigger value="about">About Page</TabsTrigger>
            <TabsTrigger value="contact">Contact Page</TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about">
            <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : ''}`}>
              <Card>
                <CardHeader>
                  <CardTitle>About Section</CardTitle>
                  <CardDescription>
                    Edit the content displayed on your About page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="about-title">Page Title</Label>
                    <Input
                      id="about-title"
                      value={aboutForm.title}
                      onChange={(e) => setAboutForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="About MFC"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="about-content">Content</Label>
                    <Textarea
                      id="about-content"
                      value={aboutForm.content}
                      onChange={(e) => setAboutForm((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder="Tell your story..."
                      rows={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Featured Image</Label>
                    <div className="flex items-center gap-4">
                      {aboutForm.image_url && (
                        <img
                          src={aboutForm.image_url}
                          alt="About preview"
                          className="h-20 w-32 object-cover rounded-lg"
                        />
                      )}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'about')}
                          className="hidden"
                        />
                        <Button variant="outline" size="sm" disabled={isUploading} asChild>
                          <span>
                            {isUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Image className="h-4 w-4 mr-2" />
                            )}
                            Upload Image
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>

                  <Button
                    onClick={handleAboutSave}
                    disabled={updateContent.isPending}
                    className="w-full"
                  >
                    {updateContent.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save About Page
                  </Button>
                </CardContent>
              </Card>

              {showPreview && (
                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold">{aboutForm.title || 'About MFC'}</h2>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {aboutForm.content || 'Your content will appear here...'}
                      </p>
                      {aboutForm.image_url && (
                        <img
                          src={aboutForm.image_url}
                          alt="Preview"
                          className="w-full rounded-lg"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : ''}`}>
              <Card>
                <CardHeader>
                  <CardTitle>Contact Section</CardTitle>
                  <CardDescription>
                    Edit your contact information and page content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-title">Page Title</Label>
                      <Input
                        id="contact-title"
                        value={contactForm.title}
                        onChange={(e) =>
                          setContactForm((prev) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="Contact Us"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="contact@mfc.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-content">Description</Label>
                    <Textarea
                      id="contact-content"
                      value={contactForm.content}
                      onChange={(e) =>
                        setContactForm((prev) => ({ ...prev, content: e.target.value }))
                      }
                      placeholder="We would love to hear from you..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-address">Address</Label>
                    <Input
                      id="contact-address"
                      value={contactForm.address}
                      onChange={(e) =>
                        setContactForm((prev) => ({ ...prev, address: e.target.value }))
                      }
                      placeholder="Viewland Zone II"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone1">Phone 1</Label>
                      <Input
                        id="contact-phone1"
                        value={contactForm.phone_1}
                        onChange={(e) =>
                          setContactForm((prev) => ({ ...prev, phone_1: e.target.value }))
                        }
                        placeholder="+91 97740 46387"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone2">Phone 2</Label>
                      <Input
                        id="contact-phone2"
                        value={contactForm.phone_2}
                        onChange={(e) =>
                          setContactForm((prev) => ({ ...prev, phone_2: e.target.value }))
                        }
                        placeholder="+91 9366372647"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-map">Google Maps Embed URL</Label>
                    <Input
                      id="contact-map"
                      value={contactForm.map_embed_url}
                      onChange={(e) =>
                        setContactForm((prev) => ({ ...prev, map_embed_url: e.target.value }))
                      }
                      placeholder="https://www.google.com/maps/embed?..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Go to Google Maps → Share → Embed a map → Copy the src URL
                    </p>
                  </div>

                  <Button
                    onClick={handleContactSave}
                    disabled={updateContent.isPending}
                    className="w-full"
                  >
                    {updateContent.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Contact Page
                  </Button>
                </CardContent>
              </Card>

              {showPreview && (
                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold">{contactForm.title || 'Contact Us'}</h2>
                      <p className="text-muted-foreground">
                        {contactForm.content || 'Your description will appear here...'}
                      </p>
                      <div className="space-y-2 text-sm">
                        {contactForm.address && (
                          <p>📍 {contactForm.address}</p>
                        )}
                        {contactForm.phone_1 && (
                          <p>📞 {contactForm.phone_1}</p>
                        )}
                        {contactForm.phone_2 && (
                          <p>📞 {contactForm.phone_2}</p>
                        )}
                        {contactForm.email && (
                          <p>✉️ {contactForm.email}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AdminSidebar>
  );
};

export default AdminContent;
