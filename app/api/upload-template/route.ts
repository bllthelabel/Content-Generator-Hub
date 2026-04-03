import { put, del } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const companyId = formData.get('companyId') as string
    const layoutType = formData.get('layoutType') as string

    if (!file || !companyId || !layoutType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user owns this company
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .eq('owner_id', user.id)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Upload to Vercel Blob with a unique filename (private store)
    const filename = `templates/${companyId}/${layoutType}-${Date.now()}.${file.name.split('.').pop()}`
    const blob = await put(filename, file, {
      access: 'private',
    })

    // Check if template already exists for this layout
    const { data: existingTemplate } = await supabase
      .from('custom_templates')
      .select('id, image_url')
      .eq('company_id', companyId)
      .eq('layout_type', layoutType)
      .single()

    if (existingTemplate) {
      // Delete old image from blob if it exists
      if (existingTemplate.image_url) {
        try {
          await del(existingTemplate.image_url)
        } catch (e) {
          console.log('Could not delete old image:', e)
        }
      }

      // Update existing template with pathname (for private blob access)
      const { error } = await supabase
        .from('custom_templates')
        .update({ 
          image_url: blob.pathname,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTemplate.id)

      if (error) {
        return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
      }
    } else {
      // Create new template with pathname (for private blob access)
      const { error } = await supabase
        .from('custom_templates')
        .insert({
          company_id: companyId,
          name: `${layoutType} Template`,
          html: '',
          css: '',
          layout_type: layoutType,
          image_url: blob.pathname,
          is_active: true
        })

      if (error) {
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
      }
    }

    return NextResponse.json({ pathname: blob.pathname })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { templateId, imageUrl } = await request.json()

    if (!templateId) {
      return NextResponse.json({ error: 'Missing template ID' }, { status: 400 })
    }

    // Verify user owns this template's company
    const { data: template } = await supabase
      .from('custom_templates')
      .select('id, company_id, companies!inner(owner_id)')
      .eq('id', templateId)
      .single()

    if (!template || (template.companies as any).owner_id !== user.id) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Delete from blob storage
    if (imageUrl) {
      try {
        await del(imageUrl)
      } catch (e) {
        console.log('Could not delete image:', e)
      }
    }

    // Update template to remove image URL
    await supabase
      .from('custom_templates')
      .update({ image_url: null })
      .eq('id', templateId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
