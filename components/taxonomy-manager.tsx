"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Tag, FolderTree, Plus, Trash2, Edit, Save, X, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  fetchCategoriesAction,
  fetchTagsAction,
  createCategoryAction,
  createTagAction,
  updateCategoryAction,
  updateTagAction,
  deleteCategoryAction,
  deleteTagAction,
} from "@/lib/actions"

const categoryFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  slug: z.string().min(1, { message: "Slug is required" }),
  description: z.string().optional(),
  parent: z.string().optional(),
})

const tagFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  slug: z.string().min(1, { message: "Slug is required" }),
  description: z.string().optional(),
})

type Category = {
  id: string
  name: string
  slug: string
  description: string
  parent: string
  count: number
}

type TagType = {
  id: string
  name: string
  slug: string
  description: string
  count: number
}

export function TaxonomyManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<TagType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingTag, setEditingTag] = useState<string | null>(null)

  const categoryForm = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      parent: "",
    },
  })

  const tagForm = useForm<z.infer<typeof tagFormSchema>>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  })

  useEffect(() => {
    loadTaxonomies()
  }, [])

  async function loadTaxonomies() {
    setIsLoading(true)
    try {
      const [categoriesData, tagsData] = await Promise.all([fetchCategoriesAction(), fetchTagsAction()])
      setCategories(categoriesData)
      setTags(tagsData)
    } catch (error) {
      console.error("Error loading taxonomies:", error)

      // Show a more specific error message
      if (error instanceof Error) {
        toast({
          title: "Error loading taxonomies",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error loading taxonomies",
          description: "Could not load categories and tags. Please check your WordPress connection.",
          variant: "destructive",
        })
      }

      // Set empty arrays as fallback
      setCategories([])
      setTags([])
    } finally {
      setIsLoading(false)
    }
  }

  async function onCategorySubmit(data: z.infer<typeof categoryFormSchema>) {
    try {
      if (editingCategory) {
        await updateCategoryAction(editingCategory, data)
        toast({
          title: "Category updated",
          description: `Category "${data.name}" has been updated.`,
        })
        setEditingCategory(null)
      } else {
        await createCategoryAction(data)
        toast({
          title: "Category created",
          description: `Category "${data.name}" has been created.`,
        })
      }

      categoryForm.reset()
      loadTaxonomies()
    } catch (error) {
      console.error("Error saving category:", error)
      toast({
        title: "Error saving category",
        description: "Could not save category. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function onTagSubmit(data: z.infer<typeof tagFormSchema>) {
    try {
      if (editingTag) {
        await updateTagAction(editingTag, data)
        toast({
          title: "Tag updated",
          description: `Tag "${data.name}" has been updated.`,
        })
        setEditingTag(null)
      } else {
        await createTagAction(data)
        toast({
          title: "Tag created",
          description: `Tag "${data.name}" has been created.`,
        })
      }

      tagForm.reset()
      loadTaxonomies()
    } catch (error) {
      console.error("Error saving tag:", error)
      toast({
        title: "Error saving tag",
        description: "Could not save tag. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function deleteCategory(id: string, name: string) {
    if (confirm(`Are you sure you want to delete the category "${name}"?`)) {
      try {
        await deleteCategoryAction(id)
        toast({
          title: "Category deleted",
          description: `Category "${name}" has been deleted.`,
        })
        loadTaxonomies()
      } catch (error) {
        console.error("Error deleting category:", error)
        toast({
          title: "Error deleting category",
          description: "Could not delete category. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  async function deleteTag(id: string, name: string) {
    if (confirm(`Are you sure you want to delete the tag "${name}"?`)) {
      try {
        await deleteTagAction(id)
        toast({
          title: "Tag deleted",
          description: `Tag "${name}" has been deleted.`,
        })
        loadTaxonomies()
      } catch (error) {
        console.error("Error deleting tag:", error)
        toast({
          title: "Error deleting tag",
          description: "Could not delete tag. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  function editCategory(category: Category) {
    setEditingCategory(category.id)
    categoryForm.reset({
      name: category.name,
      slug: category.slug,
      description: category.description,
      parent: category.parent,
    })
  }

  function editTag(tag: TagType) {
    setEditingTag(tag.id)
    tagForm.reset({
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
    })
  }

  function cancelEditCategory() {
    setEditingCategory(null)
    categoryForm.reset()
  }

  function cancelEditTag() {
    setEditingTag(null)
    tagForm.reset()
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  return (
    <Tabs defaultValue="categories" className="space-y-4">
      <div className="flex justify-between items-center">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>
        <Button variant="outline" size="sm" onClick={loadTaxonomies} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <TabsContent value="categories" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{editingCategory ? "Edit Category" : "Add Category"}</CardTitle>
              <CardDescription>
                {editingCategory ? "Update an existing category" : "Create a new category for your blog posts"}
              </CardDescription>
            </CardHeader>
            <Form {...categoryForm}>
              <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Technology"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              // Auto-generate slug if not editing
                              if (!editingCategory && !categoryForm.getValues().slug) {
                                categoryForm.setValue("slug", generateSlug(e.target.value))
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>The name of the category as it appears on your site</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="technology" {...field} />
                        </FormControl>
                        <FormDescription>The URL-friendly version of the name</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="A description of the category..." {...field} />
                        </FormControl>
                        <FormDescription>The description is not prominent by default</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="parent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Category (Optional)</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="">None</option>
                            {categories
                              .filter((cat) => cat.id !== editingCategory) // Don't show current category as parent option
                              .map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                          </select>
                        </FormControl>
                        <FormDescription>Categories can have a hierarchy</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div>
                    <Button type="submit">
                      {editingCategory ? (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Update Category
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Category
                        </>
                      )}
                    </Button>
                  </div>
                  {editingCategory && (
                    <Button type="button" variant="outline" onClick={cancelEditCategory}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </CardFooter>
              </form>
            </Form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Manage your blog categories</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading categories...</div>
              ) : categories.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No categories found. Create your first category.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Posts</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <FolderTree className="h-4 w-4 mr-2 text-muted-foreground" />
                            {category.name}
                          </div>
                        </TableCell>
                        <TableCell>{category.slug}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{category.count}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => editCategory(category)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteCategory(category.id, category.name)}
                              disabled={category.count > 0}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="tags" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{editingTag ? "Edit Tag" : "Add Tag"}</CardTitle>
              <CardDescription>
                {editingTag ? "Update an existing tag" : "Create a new tag for your blog posts"}
              </CardDescription>
            </CardHeader>
            <Form {...tagForm}>
              <form onSubmit={tagForm.handleSubmit(onTagSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={tagForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="WordPress"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              // Auto-generate slug if not editing
                              if (!editingTag && !tagForm.getValues().slug) {
                                tagForm.setValue("slug", generateSlug(e.target.value))
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>The name of the tag as it appears on your site</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={tagForm.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="wordpress" {...field} />
                        </FormControl>
                        <FormDescription>The URL-friendly version of the name</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={tagForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="A description of the tag..." {...field} />
                        </FormControl>
                        <FormDescription>The description is not prominent by default</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div>
                    <Button type="submit">
                      {editingTag ? (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Update Tag
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Tag
                        </>
                      )}
                    </Button>
                  </div>
                  {editingTag && (
                    <Button type="button" variant="outline" onClick={cancelEditTag}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </CardFooter>
              </form>
            </Form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Manage your blog tags</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading tags...</div>
              ) : tags.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No tags found. Create your first tag.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Posts</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                            {tag.name}
                          </div>
                        </TableCell>
                        <TableCell>{tag.slug}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{tag.count}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => editTag(tag)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteTag(tag.id, tag.name)}
                              disabled={tag.count > 0}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}

