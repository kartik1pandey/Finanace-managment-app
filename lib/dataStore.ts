import { supabase, isSupabaseConfigured } from './supabase'

export async function upsertUser(email: string, name?: string) {
  const { data, error } = await supabase.from('users').upsert({ email, name }, { onConflict: 'email' }).select().single()
  if (error) throw error
  return data
}

export async function saveFinancialSummary(userEmail: string, summary: Record<string, unknown>, assets: Record<string, unknown>[] = [], liabilities: Record<string, unknown>[] = []) {
  const { data: user } = await supabase.from('users').select('id').eq('email', userEmail).single()
  if (!user) throw new Error('user not found')
  const { error } = await supabase.from('net_worth_summary').upsert({ user_id: user.id, total_net_worth_units: summary?.net_worth ?? 0, assets, liabilities, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function saveAccounts(userEmail: string, accounts: Record<string, unknown>[]) {
  const { data: user } = await supabase.from('users').select('id').eq('email', userEmail).single()
  if (!user) throw new Error('user not found')
  const normalized = accounts.map(a => ({ user_id: user.id, external_id: a.id, type: a.type, masked_number: a.masked_number, fip: a.fip, bank: a.bank, balance: a.balance ?? null, current_value: a.current_value ?? null, holdings: a.holdings ?? null }))
  const { error } = await supabase.from('accounts').upsert(normalized, { onConflict: 'user_id,external_id' })
  if (error) throw error
}

export async function saveMutualFunds(userEmail: string, funds: Record<string, unknown>[]) {
  const { data: user } = await supabase.from('users').select('id').eq('email', userEmail).single()
  if (!user) throw new Error('user not found')
  const rows = funds.map(f => ({ user_id: user.id, name: f.name, amc: f.amc, category: f.category, nav: f.nav ?? null, current_value: f.current_value ?? null, invested_value: f.invested_value ?? null, units: f.units ?? null, xirr: f.xirr ?? null, absolute_returns: f.absolute_returns ?? null, unrealised_returns: f.unrealised_returns ?? null }))
  const { error } = await supabase.from('mutual_funds').upsert(rows, { onConflict: 'user_id,name' })
  if (error) throw error
}

export async function loadDashboardData(userEmail: string) {
  const { data: user } = await supabase.from('users').select('id').eq('email', userEmail).single()
  if (!user) return null
  const { data: summary } = await supabase.from('net_worth_summary').select('*').eq('user_id', user.id).maybeSingle()
  const { data: accounts } = await supabase.from('accounts').select('*').eq('user_id', user.id)
  const { data: funds } = await supabase.from('mutual_funds').select('*').eq('user_id', user.id)
  if (!summary && (!accounts || accounts.length === 0) && (!funds || funds.length === 0)) return null
  return { summary, accounts: accounts || [], funds: funds || [] }
}

export async function saveRawMCPData(userEmail: string, result: Record<string, unknown>, sessionId?: string) {
  const { data: user } = await supabase.from('users').select('id').eq('email', userEmail).single()
  if (!user) throw new Error('user not found')
  const payload = { user_id: user.id, session_id: sessionId || null, result, updated_at: new Date().toISOString() }
  const { error } = await supabase.from('mcp_data').upsert(payload, { onConflict: 'user_id' })
  if (error) throw error
}

export async function loadRawMCPData(userEmail: string) {
  const { data: user } = await supabase.from('users').select('id').eq('email', userEmail).single()
  if (!user) return null
  const { data } = await supabase.from('mcp_data').select('result').eq('user_id', user.id).maybeSingle()
  return data?.result ?? null
}

// ============================================
// RECEIPT FUNCTIONS
// ============================================

export interface ReceiptData {
  id?: string
  filename: string
  store_name?: string
  total_amount?: number
  purchase_date?: string
  category?: string
  items?: Array<{ name: string; price: number; quantity: number }>
  raw_text?: string
  image_path: string
  image_url?: string
  status: 'processing' | 'completed' | 'failed'
  error_message?: string
  upload_date?: string
}

export async function saveReceipt(userEmail: string, receipt: ReceiptData) {
  console.log('[saveReceipt] Starting save for:', userEmail)
  
  // First, ensure the user exists (create if not exists)
  try {
    await upsertUser(userEmail)
    console.log('[saveReceipt] User ensured to exist')
  } catch (upsertError) {
    console.error('[saveReceipt] Failed to ensure user exists:', upsertError)
    throw new Error(`Failed to create/find user: ${upsertError}`)
  }
  
  // Now get the user
  const { data: user, error: userError } = await supabase.from('users').select('id').eq('email', userEmail).single()
  
  if (userError) {
    console.error('[saveReceipt] User lookup error:', userError)
    throw new Error(`Failed to find user: ${userError.message}`)
  }
  
  if (!user) {
    console.error('[saveReceipt] User not found for email:', userEmail)
    throw new Error('user not found')
  }

  console.log('[saveReceipt] User found, ID:', user.id)

  const payload = {
    user_id: user.id,
    filename: receipt.filename,
    store_name: receipt.store_name || null,
    total_amount: receipt.total_amount || null,
    purchase_date: receipt.purchase_date || null,
    category: receipt.category || null,
    items: receipt.items || null,
    raw_text: receipt.raw_text || null,
    image_path: receipt.image_path,
    image_url: receipt.image_url || null,
    status: receipt.status,
    error_message: receipt.error_message || null,
    upload_date: receipt.upload_date || new Date().toISOString()
  }

  console.log('[saveReceipt] Inserting payload:', payload)

  const { data, error } = await supabase.from('receipts').insert(payload).select().single()
  
  if (error) {
    console.error('[saveReceipt] Insert error:', error)
    console.error('[saveReceipt] Error details:', JSON.stringify(error, null, 2))
    throw new Error(`Failed to save receipt: ${error.message}`)
  }
  
  console.log('[saveReceipt] Save successful, ID:', data.id)
  return data
}

export async function loadReceipts(userEmail: string) {
  // First, ensure the user exists (create if not exists)
  try {
    await upsertUser(userEmail)
  } catch (upsertError) {
    console.error('[loadReceipts] Failed to ensure user exists:', upsertError)
    return []
  }
  
  const { data: user } = await supabase.from('users').select('id').eq('email', userEmail).single()
  if (!user) return []

  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', user.id)
    .order('upload_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function deleteReceipt(userEmail: string, receiptId: string) {
  const { data: user } = await supabase.from('users').select('id').eq('email', userEmail).single()
  if (!user) throw new Error('user not found')

  // WORKAROUND: Since we're storing base64 in database, no need to delete from storage
  // Just delete the receipt record
  const { error } = await supabase
    .from('receipts')
    .delete()
    .eq('id', receiptId)
    .eq('user_id', user.id)

  if (error) throw error
}

export async function uploadReceiptImage(userEmail: string, file: File): Promise<{ path: string; url: string }> {
  console.log('[uploadReceiptImage] Starting upload for:', userEmail)
  console.log('[uploadReceiptImage] WORKAROUND: Converting to base64 instead of storage')
  
  // First, ensure the user exists (create if not exists)
  try {
    await upsertUser(userEmail)
    console.log('[uploadReceiptImage] User ensured to exist')
  } catch (upsertError) {
    console.error('[uploadReceiptImage] Failed to ensure user exists:', upsertError)
    throw new Error(`Failed to create/find user: ${upsertError}`)
  }
  
  const { data: user, error: userError } = await supabase.from('users').select('id').eq('email', userEmail).single()
  
  if (userError) {
    console.error('[uploadReceiptImage] User lookup error:', userError)
    throw new Error(`Failed to find user: ${userError.message}`)
  }
  
  if (!user) {
    console.error('[uploadReceiptImage] User not found for email:', userEmail)
    throw new Error('user not found')
  }

  console.log('[uploadReceiptImage] User found, ID:', user.id)

  // WORKAROUND: Convert to base64 data URL instead of uploading to storage
  // This bypasses the storage RLS issue entirely
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      const base64Url = reader.result as string
      const timestamp = Date.now()
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fakePath = `${user.id}/${timestamp}_${sanitizedFilename}`
      
      console.log('[uploadReceiptImage] Converted to base64 successfully')
      
      resolve({
        path: fakePath,
        url: base64Url // This is a data URL, not a storage URL
      })
    }
    
    reader.onerror = () => {
      console.error('[uploadReceiptImage] Failed to read file')
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

// ============================================
// FAVORITE STOCKS FUNCTIONS
// ============================================

export async function saveFavoriteStocks(userEmail: string, favoriteStocks: string[]) {
  // Skip if Supabase is not configured (build time)
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, skipping save')
    return
  }

  // Get the authenticated user's ID from Supabase auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  const { error } = await supabase
    .from('favorite_stocks')
    .upsert(
      { user_id: user.id, stocks: favoriteStocks, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  
  if (error) throw error
}

export async function loadFavoriteStocks(userEmail: string): Promise<string[]> {
  // Skip if Supabase is not configured (build time)
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, returning default favorites')
    return ['AAPL', 'GOOGL']
  }

  // Get the authenticated user's ID from Supabase auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ['AAPL', 'GOOGL'] // Default favorites for unauthenticated users
  
  const { data, error } = await supabase
    .from('favorite_stocks')
    .select('stocks')
    .eq('user_id', user.id)
    .maybeSingle()
  
  if (error) throw error
  return data?.stocks || ['AAPL', 'GOOGL'] // Default favorites if none found
}