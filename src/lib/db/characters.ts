/**
 * Character Database Operations
 * 
 * CRUD operations for the Knights of Belyar character system.
 * All functions follow the { data, error } return pattern.
 */

import { supabase } from '../supabase'
import type { 
  Character, 
  CharacterCreationData, 
  Skill, 
  ArmorSlot,
  CharacterStats,
  ArmorType,
  CharacterWeapon,
  CharacterWeaponSlot,
  CharacterQuickSlot,
  CharacterItem,
  WeaponHand,
  WeaponSlotNumber,
  QuickSlotNumber,
} from '../types'
import { calculateMaxHP, calculateMaxHitDice } from '../constants'

// ============ Reference Data ============

/**
 * Fetch all skills from the reference table
 */
export async function fetchSkills(): Promise<{
  data: Skill[] | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('display_order')

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Fetch all armor slots from the reference table
 */
export async function fetchArmorSlots(): Promise<{
  data: ArmorSlot[] | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('armor_slots')
    .select('*')
    .order('slot_order')

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// ============ Character CRUD ============

/**
 * Check if the current user has a character
 */
export async function hasCharacter(userId: string): Promise<{
  exists: boolean
  error: string | null
}> {
  const { data, error } = await supabase
    .from('characters')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned (expected if no character)
    return { exists: false, error: error.message }
  }

  return { exists: !!data, error: null }
}

/**
 * Fetch the current user's character
 */
export async function fetchCharacter(userId: string): Promise<{
  data: Character | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No character found
      return { data: null, error: null }
    }
    return { data: null, error: error.message }
  }

  return { data: data as Character, error: null }
}

/**
 * Create a new character
 */
export async function createCharacter(
  userId: string,
  data: CharacterCreationData
): Promise<{
  data: Character | null
  error: string | null
}> {
  // Calculate derived values
  const maxHP = calculateMaxHP(data.stats.con)
  const maxHitDice = calculateMaxHitDice(1) // Level 1

  const characterData = {
    user_id: userId,
    name: data.name,
    race: data.race,
    subrace: data.subrace,
    class: data.class,
    level: 1,
    background: data.background,
    previous_profession: data.previous_profession,
    knight_order: data.knight_order,
    vocation: data.vocation,
    feat: data.feat,
    touched_by_fate: null,
    
    // Stats
    str: data.stats.str,
    dex: data.stats.dex,
    con: data.stats.con,
    int: data.stats.int,
    wis: data.stats.wis,
    cha: data.stats.cha,
    hon: data.stats.hon,
    
    // Combat (start at max)
    hp_current: maxHP,
    hp_custom_modifier: 0,
    hit_dice_current: maxHitDice,
    
    // Money (will be rolled separately)
    platinum: 0,
    gold: 0,
    silver: 0,
    copper: 0,
    
    // Flavor
    appearance: data.appearance,
    artwork_url: null,
  }

  const { data: character, error } = await supabase
    .from('characters')
    .insert(characterData)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  // Insert skill proficiencies
  if (data.skill_proficiencies.length > 0) {
    const skillRows = data.skill_proficiencies.map(skillId => ({
      character_id: character.id,
      skill_id: skillId,
      is_proficient: true,
      is_expertise: false,
    }))

    const { error: skillError } = await supabase
      .from('character_skills')
      .insert(skillRows)

    if (skillError) {
      console.error('Failed to insert skill proficiencies:', skillError)
      // Don't fail character creation, just log
    }
  }

  return { data: character as Character, error: null }
}

/**
 * Update character money
 */
export async function updateCharacterMoney(
  characterId: string,
  money: { platinum?: number; gold?: number; silver?: number; copper?: number }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('characters')
    .update(money)
    .eq('id', characterId)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Update character HP
 */
export async function updateCharacterHP(
  characterId: string,
  hpCurrent: number
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('characters')
    .update({ hp_current: hpCurrent })
    .eq('id', characterId)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Update character hit dice
 */
export async function updateCharacterHitDice(
  characterId: string,
  hitDiceCurrent: number
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('characters')
    .update({ hit_dice_current: hitDiceCurrent })
    .eq('id', characterId)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Update character level
 */
export async function updateCharacterLevel(
  characterId: string,
  level: number
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('characters')
    .update({ level })
    .eq('id', characterId)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Delete a character (on death)
 */
export async function deleteCharacter(characterId: string): Promise<{
  error: string | null
}> {
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', characterId)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

// ============ Armor Operations ============

/**
 * Set armor for a character slot
 */
export async function setCharacterArmor(
  characterId: string,
  slotId: number,
  armorType: ArmorType,
  options?: {
    customName?: string
    material?: string
    isMagical?: boolean
    properties?: Record<string, unknown>
    notes?: string
  }
): Promise<{ error: string | null }> {
  const armorData = {
    character_id: characterId,
    slot_id: slotId,
    armor_type: armorType,
    custom_name: options?.customName || null,
    material: options?.material || null,
    is_magical: options?.isMagical || false,
    properties: options?.properties || null,
    notes: options?.notes || null,
  }

  // Upsert (insert or update)
  const { error } = await supabase
    .from('character_armor')
    .upsert(armorData, { onConflict: 'character_id,slot_id' })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Set multiple armor pieces at once (for character creation)
 * Uses slot_key to look up slot_id
 */
export async function setCharacterArmorBatch(
  characterId: string,
  armorSlots: Array<{ id: number; slot_key: string }>,
  pieces: Array<{ slot_key: string; armor_type: ArmorType }>
): Promise<{ error: string | null }> {
  // Map slot_key to slot_id
  const slotKeyToId = new Map(armorSlots.map(s => [s.slot_key, s.id]))
  
  const armorRows = pieces
    .filter(p => slotKeyToId.has(p.slot_key))
    .map(p => ({
      character_id: characterId,
      slot_id: slotKeyToId.get(p.slot_key)!,
      armor_type: p.armor_type,
      custom_name: null,
      material: null,
      is_magical: false,
      properties: null,
      notes: null,
    }))

  if (armorRows.length === 0) {
    return { error: null }
  }

  const { error } = await supabase
    .from('character_armor')
    .insert(armorRows)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Remove armor from a character slot
 */
export async function removeCharacterArmor(
  characterId: string,
  slotId: number
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('character_armor')
    .delete()
    .eq('character_id', characterId)
    .eq('slot_id', slotId)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Fetch all armor for a character
 */
export async function fetchCharacterArmor(characterId: string): Promise<{
  data: Array<{
    id: string
    slot_id: number
    armor_type: ArmorType
    custom_name: string | null
    material: string | null
    is_magical: boolean
    properties: Record<string, unknown> | null
    notes: string | null
    slot: ArmorSlot
  }> | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('character_armor')
    .select(`
      id,
      slot_id,
      armor_type,
      custom_name,
      material,
      is_magical,
      properties,
      notes,
      armor_slots (*)
    `)
    .eq('character_id', characterId)

  if (error) {
    return { data: null, error: error.message }
  }

  // Transform the joined data
  const transformed = (data || []).map(row => ({
    id: row.id,
    slot_id: row.slot_id,
    armor_type: row.armor_type as ArmorType,
    custom_name: row.custom_name,
    material: row.material,
    is_magical: row.is_magical,
    properties: row.properties as Record<string, unknown> | null,
    notes: row.notes,
    slot: row.armor_slots as unknown as ArmorSlot,
  }))

  return { data: transformed, error: null }
}

// ============ Weapon Operations ============

/**
 * Add a weapon to a character
 */
export async function addCharacterWeapon(
  characterId: string,
  weapon: {
    name: string
    weaponType?: string
    material?: string
    damageDice?: string
    damageType?: string
    properties?: Record<string, unknown>
    isMagical?: boolean
    isEquipped?: boolean
    notes?: string
  }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('character_weapons')
    .insert({
      character_id: characterId,
      name: weapon.name,
      weapon_type: weapon.weaponType || null,
      material: weapon.material || 'Steel',
      damage_dice: weapon.damageDice || null,
      damage_type: weapon.damageType || null,
      properties: weapon.properties || null,
      is_magical: weapon.isMagical || false,
      is_equipped: weapon.isEquipped || false,
      notes: weapon.notes || null,
    })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

// ============ Skill Operations ============

/**
 * Fetch character's skill proficiencies
 */
export async function fetchCharacterSkills(characterId: string): Promise<{
  data: Array<{
    skill: Skill
    is_proficient: boolean
    is_expertise: boolean
  }> | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('character_skills')
    .select(`
      is_proficient,
      is_expertise,
      skills (*)
    `)
    .eq('character_id', characterId)

  if (error) {
    return { data: null, error: error.message }
  }

  const transformed = (data || []).map(row => ({
    skill: row.skills as unknown as Skill,
    is_proficient: row.is_proficient,
    is_expertise: row.is_expertise,
  }))

  return { data: transformed, error: null }
}

// ============ Weapon Slot Operations ============

/**
 * Fetch all weapon slots for a character (with joined weapon data)
 */
export async function fetchCharacterWeaponSlots(characterId: string): Promise<{
  data: CharacterWeaponSlot[] | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('character_weapon_slots')
    .select(`
      id,
      character_id,
      hand,
      slot_number,
      weapon_id,
      is_active,
      selected_ammo_id,
      character_weapons (*),
      character_items (*)
    `)
    .eq('character_id', characterId)
    .order('hand')
    .order('slot_number')

  if (error) {
    return { data: null, error: error.message }
  }

  const transformed = (data || []).map(row => ({
    id: row.id,
    character_id: row.character_id,
    hand: row.hand as WeaponHand,
    slot_number: row.slot_number as 1 | 2 | 3,
    weapon_id: row.weapon_id,
    is_active: row.is_active,
    selected_ammo_id: row.selected_ammo_id,
    weapon: row.character_weapons as CharacterWeapon | null,
    selected_ammo: row.character_items as CharacterItem | null,
  }))

  return { data: transformed, error: null }
}

/**
 * Equip a weapon to a slot
 */
export async function equipWeaponToSlot(
  characterId: string,
  hand: WeaponHand,
  slotNumber: WeaponSlotNumber,
  weaponId: string | null
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('character_weapon_slots')
    .update({ weapon_id: weaponId })
    .eq('character_id', characterId)
    .eq('hand', hand)
    .eq('slot_number', slotNumber)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Set the active weapon slot for a hand
 */
export async function setActiveWeaponSlot(
  characterId: string,
  hand: WeaponHand,
  slotNumber: WeaponSlotNumber
): Promise<{ error: string | null }> {
  // First, deactivate all slots for this hand
  const { error: deactivateError } = await supabase
    .from('character_weapon_slots')
    .update({ is_active: false })
    .eq('character_id', characterId)
    .eq('hand', hand)

  if (deactivateError) {
    return { error: deactivateError.message }
  }

  // Then activate the selected slot
  const { error: activateError } = await supabase
    .from('character_weapon_slots')
    .update({ is_active: true })
    .eq('character_id', characterId)
    .eq('hand', hand)
    .eq('slot_number', slotNumber)

  if (activateError) {
    return { error: activateError.message }
  }

  return { error: null }
}

/**
 * Set selected ammo for a weapon slot (for ranged weapons)
 */
export async function setWeaponSlotAmmo(
  characterId: string,
  hand: WeaponHand,
  slotNumber: WeaponSlotNumber,
  ammoItemId: string | null
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('character_weapon_slots')
    .update({ selected_ammo_id: ammoItemId })
    .eq('character_id', characterId)
    .eq('hand', hand)
    .eq('slot_number', slotNumber)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

// ============ Quick Slot Operations ============

/**
 * Fetch all quick slots for a character (with joined item data)
 */
export async function fetchCharacterQuickSlots(characterId: string): Promise<{
  data: CharacterQuickSlot[] | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('character_quick_slots')
    .select(`
      id,
      character_id,
      slot_number,
      item_id,
      character_items (*)
    `)
    .eq('character_id', characterId)
    .order('slot_number')

  if (error) {
    return { data: null, error: error.message }
  }

  const transformed = (data || []).map(row => ({
    id: row.id,
    character_id: row.character_id,
    slot_number: row.slot_number as 1 | 2 | 3 | 4 | 5 | 6,
    item_id: row.item_id,
    item: row.character_items as CharacterItem | null,
  }))

  return { data: transformed, error: null }
}

/**
 * Assign an item to a quick slot
 */
export async function setQuickSlotItem(
  characterId: string,
  slotNumber: QuickSlotNumber,
  itemId: string | null
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('character_quick_slots')
    .update({ item_id: itemId })
    .eq('character_id', characterId)
    .eq('slot_number', slotNumber)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

// ============ Weapon Inventory Operations ============

/**
 * Fetch all weapons owned by a character
 */
export async function fetchCharacterWeapons(characterId: string): Promise<{
  data: CharacterWeapon[] | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('character_weapons')
    .select('*')
    .eq('character_id', characterId)
    .order('name')

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as CharacterWeapon[], error: null }
}

/**
 * Fetch all items owned by a character
 */
export async function fetchCharacterItems(characterId: string): Promise<{
  data: CharacterItem[] | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('character_items')
    .select('*')
    .eq('character_id', characterId)
    .order('name')

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as CharacterItem[], error: null }
}

