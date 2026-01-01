export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      armor_slots: {
        Row: {
          created_at: string | null
          display_name: string
          heavy_available: boolean
          heavy_bonus: number | null
          heavy_piece_name: string | null
          id: number
          light_available: boolean
          light_bonus: number | null
          light_piece_name: string | null
          medium_available: boolean
          medium_bonus: number | null
          medium_piece_name: string | null
          slot_key: string
          slot_order: number
        }
        Insert: {
          created_at?: string | null
          display_name: string
          heavy_available?: boolean
          heavy_bonus?: number | null
          heavy_piece_name?: string | null
          id?: number
          light_available?: boolean
          light_bonus?: number | null
          light_piece_name?: string | null
          medium_available?: boolean
          medium_bonus?: number | null
          medium_piece_name?: string | null
          slot_key: string
          slot_order: number
        }
        Update: {
          created_at?: string | null
          display_name?: string
          heavy_available?: boolean
          heavy_bonus?: number | null
          heavy_piece_name?: string | null
          id?: number
          light_available?: boolean
          light_bonus?: number | null
          light_piece_name?: string | null
          medium_available?: boolean
          medium_bonus?: number | null
          medium_piece_name?: string | null
          slot_key?: string
          slot_order?: number
        }
        Relationships: []
      }
      biome_herbs: {
        Row: {
          biome_id: number
          herb_id: number
          id: number
          weight: number
        }
        Insert: {
          biome_id: number
          herb_id: number
          id?: number
          weight: number
        }
        Update: {
          biome_id?: number
          herb_id?: number
          id?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "biome_herbs_biome_id_fkey"
            columns: ["biome_id"]
            isOneToOne: false
            referencedRelation: "biomes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biome_herbs_herb_id_fkey"
            columns: ["herb_id"]
            isOneToOne: false
            referencedRelation: "herbs"
            referencedColumns: ["id"]
          },
        ]
      }
      biomes: {
        Row: {
          description: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      character_armor: {
        Row: {
          armor_type: string
          character_id: string
          created_at: string | null
          custom_name: string | null
          id: string
          is_magical: boolean
          material: string | null
          notes: string | null
          properties: Json | null
          slot_id: number
          updated_at: string | null
        }
        Insert: {
          armor_type: string
          character_id: string
          created_at?: string | null
          custom_name?: string | null
          id?: string
          is_magical?: boolean
          material?: string | null
          notes?: string | null
          properties?: Json | null
          slot_id: number
          updated_at?: string | null
        }
        Update: {
          armor_type?: string
          character_id?: string
          created_at?: string | null
          custom_name?: string | null
          id?: string
          is_magical?: boolean
          material?: string | null
          notes?: string | null
          properties?: Json | null
          slot_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_armor_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_armor_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "armor_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      character_brewed: {
        Row: {
          character_id: string
          choices: Json | null
          computed_description: string | null
          created_at: string | null
          effects: Json
          id: number
          quantity: number
          type: string
          updated_at: string | null
        }
        Insert: {
          character_id: string
          choices?: Json | null
          computed_description?: string | null
          created_at?: string | null
          effects?: Json
          id?: number
          quantity?: number
          type: string
          updated_at?: string | null
        }
        Update: {
          character_id?: string
          choices?: Json | null
          computed_description?: string | null
          created_at?: string | null
          effects?: Json
          id?: number
          quantity?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_brewed_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_herbs: {
        Row: {
          character_id: string
          created_at: string | null
          herb_id: number
          id: number
          quantity: number
          updated_at: string | null
        }
        Insert: {
          character_id: string
          created_at?: string | null
          herb_id: number
          id?: number
          quantity?: number
          updated_at?: string | null
        }
        Update: {
          character_id?: string
          created_at?: string | null
          herb_id?: number
          id?: number
          quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_herbs_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_herbs_herb_id_fkey"
            columns: ["herb_id"]
            isOneToOne: false
            referencedRelation: "herbs"
            referencedColumns: ["id"]
          },
        ]
      }
      character_items: {
        Row: {
          ammo_type: string | null
          category: string | null
          character_id: string
          created_at: string | null
          id: string
          is_quick_access: boolean
          name: string
          notes: string | null
          properties: Json | null
          quantity: number
          template_id: number | null
          updated_at: string | null
        }
        Insert: {
          ammo_type?: string | null
          category?: string | null
          character_id: string
          created_at?: string | null
          id?: string
          is_quick_access?: boolean
          name: string
          notes?: string | null
          properties?: Json | null
          quantity?: number
          template_id?: number | null
          updated_at?: string | null
        }
        Update: {
          ammo_type?: string | null
          category?: string | null
          character_id?: string
          created_at?: string | null
          id?: string
          is_quick_access?: boolean
          name?: string
          notes?: string | null
          properties?: Json | null
          quantity?: number
          template_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_items_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "item_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      character_quick_slots: {
        Row: {
          brewed_item_id: number | null
          character_brewed_id: number | null
          character_id: string
          created_at: string | null
          id: string
          item_id: string | null
          slot_number: number
          updated_at: string | null
        }
        Insert: {
          brewed_item_id?: number | null
          character_brewed_id?: number | null
          character_id: string
          created_at?: string | null
          id?: string
          item_id?: string | null
          slot_number: number
          updated_at?: string | null
        }
        Update: {
          brewed_item_id?: number | null
          character_brewed_id?: number | null
          character_id?: string
          created_at?: string | null
          id?: string
          item_id?: string | null
          slot_number?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_quick_slots_brewed_item_id_fkey"
            columns: ["brewed_item_id"]
            isOneToOne: false
            referencedRelation: "user_brewed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_quick_slots_character_brewed_id_fkey"
            columns: ["character_brewed_id"]
            isOneToOne: false
            referencedRelation: "character_brewed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_quick_slots_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_quick_slots_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "character_items"
            referencedColumns: ["id"]
          },
        ]
      }
      character_recipes: {
        Row: {
          character_id: string
          id: number
          recipe_id: number
          unlocked_at: string | null
        }
        Insert: {
          character_id: string
          id?: number
          recipe_id: number
          unlocked_at?: string | null
        }
        Update: {
          character_id?: string
          id?: number
          recipe_id?: number
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_recipes_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      character_skills: {
        Row: {
          character_id: string
          created_at: string | null
          id: string
          is_expertise: boolean
          is_proficient: boolean
          skill_id: number
        }
        Insert: {
          character_id: string
          created_at?: string | null
          id?: string
          is_expertise?: boolean
          is_proficient?: boolean
          skill_id: number
        }
        Update: {
          character_id?: string
          created_at?: string | null
          id?: string
          is_expertise?: boolean
          is_proficient?: boolean
          skill_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_skills_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      character_weapon_slots: {
        Row: {
          character_id: string
          created_at: string | null
          hand: string
          id: string
          is_active: boolean
          selected_ammo_id: string | null
          slot_number: number
          updated_at: string | null
          weapon_id: string | null
        }
        Insert: {
          character_id: string
          created_at?: string | null
          hand: string
          id?: string
          is_active?: boolean
          selected_ammo_id?: string | null
          slot_number: number
          updated_at?: string | null
          weapon_id?: string | null
        }
        Update: {
          character_id?: string
          created_at?: string | null
          hand?: string
          id?: string
          is_active?: boolean
          selected_ammo_id?: string | null
          slot_number?: number
          updated_at?: string | null
          weapon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_weapon_slots_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_weapon_slots_selected_ammo_id_fkey"
            columns: ["selected_ammo_id"]
            isOneToOne: false
            referencedRelation: "character_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_weapon_slots_weapon_id_fkey"
            columns: ["weapon_id"]
            isOneToOne: false
            referencedRelation: "character_weapons"
            referencedColumns: ["id"]
          },
        ]
      }
      character_weapons: {
        Row: {
          attachments: Json | null
          character_id: string
          created_at: string | null
          damage_dice: string | null
          damage_type: string | null
          id: string
          is_equipped: boolean
          is_magical: boolean
          is_two_handed: boolean
          material: string
          material_id: number | null
          name: string
          notes: string | null
          properties: Json | null
          template_id: number | null
          updated_at: string | null
          weapon_type: string | null
        }
        Insert: {
          attachments?: Json | null
          character_id: string
          created_at?: string | null
          damage_dice?: string | null
          damage_type?: string | null
          id?: string
          is_equipped?: boolean
          is_magical?: boolean
          is_two_handed?: boolean
          material?: string
          material_id?: number | null
          name: string
          notes?: string | null
          properties?: Json | null
          template_id?: number | null
          updated_at?: string | null
          weapon_type?: string | null
        }
        Update: {
          attachments?: Json | null
          character_id?: string
          created_at?: string | null
          damage_dice?: string | null
          damage_type?: string | null
          id?: string
          is_equipped?: boolean
          is_magical?: boolean
          is_two_handed?: boolean
          material?: string
          material_id?: number | null
          name?: string
          notes?: string | null
          properties?: Json | null
          template_id?: number | null
          updated_at?: string | null
          weapon_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_weapons_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_weapons_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_weapons_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "weapon_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          appearance: string | null
          artwork_url: string | null
          background: string
          cha: number
          class: string
          con: number
          copper: number
          created_at: string | null
          dex: number
          feat: string | null
          gold: number
          hit_dice_current: number
          hon: number
          hp_current: number
          hp_custom_modifier: number
          id: string
          int: number
          knight_order: string
          level: number
          name: string
          platinum: number
          previous_profession: string | null
          race: string
          silver: number
          str: number
          subrace: string | null
          touched_by_fate: string | null
          updated_at: string | null
          user_id: string
          vocation: string | null
          wis: number
        }
        Insert: {
          appearance?: string | null
          artwork_url?: string | null
          background: string
          cha?: number
          class: string
          con?: number
          copper?: number
          created_at?: string | null
          dex?: number
          feat?: string | null
          gold?: number
          hit_dice_current: number
          hon?: number
          hp_current: number
          hp_custom_modifier?: number
          id?: string
          int?: number
          knight_order: string
          level?: number
          name: string
          platinum?: number
          previous_profession?: string | null
          race: string
          silver?: number
          str?: number
          subrace?: string | null
          touched_by_fate?: string | null
          updated_at?: string | null
          user_id: string
          vocation?: string | null
          wis?: number
        }
        Update: {
          appearance?: string | null
          artwork_url?: string | null
          background?: string
          cha?: number
          class?: string
          con?: number
          copper?: number
          created_at?: string | null
          dex?: number
          feat?: string | null
          gold?: number
          hit_dice_current?: number
          hon?: number
          hp_current?: number
          hp_custom_modifier?: number
          id?: string
          int?: number
          knight_order?: string
          level?: number
          name?: string
          platinum?: number
          previous_profession?: string | null
          race?: string
          silver?: number
          str?: number
          subrace?: string | null
          touched_by_fate?: string | null
          updated_at?: string | null
          user_id?: string
          vocation?: string | null
          wis?: number
        }
        Relationships: []
      }
      herbs: {
        Row: {
          description: string | null
          elements: string[]
          id: number
          name: string
          property: string | null
          rarity: string
        }
        Insert: {
          description?: string | null
          elements: string[]
          id?: number
          name: string
          property?: string | null
          rarity: string
        }
        Update: {
          description?: string | null
          elements?: string[]
          id?: number
          name?: string
          property?: string | null
          rarity?: string
        }
        Relationships: []
      }
      item_templates: {
        Row: {
          ammo_type: string | null
          base_cost_gp: number | null
          category: string
          created_at: string | null
          description: string | null
          effects: Json | null
          id: number
          name: string
          uses: number | null
          weight_lb: number | null
        }
        Insert: {
          ammo_type?: string | null
          base_cost_gp?: number | null
          category: string
          created_at?: string | null
          description?: string | null
          effects?: Json | null
          id?: number
          name: string
          uses?: number | null
          weight_lb?: number | null
        }
        Update: {
          ammo_type?: string | null
          base_cost_gp?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          effects?: Json | null
          id?: number
          name?: string
          uses?: number | null
          weight_lb?: number | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          ac_bonus: number | null
          attack_bonus: number | null
          cost_multiplier: number | null
          created_at: string | null
          damage_bonus: number | null
          description: string | null
          id: number
          name: string
          properties: Json | null
          tier: number
        }
        Insert: {
          ac_bonus?: number | null
          attack_bonus?: number | null
          cost_multiplier?: number | null
          created_at?: string | null
          damage_bonus?: number | null
          description?: string | null
          id?: number
          name: string
          properties?: Json | null
          tier?: number
        }
        Update: {
          ac_bonus?: number | null
          attack_bonus?: number | null
          cost_multiplier?: number | null
          created_at?: string | null
          damage_bonus?: number | null
          description?: string | null
          id?: number
          name?: string
          properties?: Json | null
          tier?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          foraging_modifier: number
          herbalism_modifier: number
          id: string
          is_herbalist: boolean
          max_foraging_sessions: number
          username: string
        }
        Insert: {
          created_at?: string | null
          foraging_modifier?: number
          herbalism_modifier?: number
          id: string
          is_herbalist?: boolean
          max_foraging_sessions?: number
          username: string
        }
        Update: {
          created_at?: string | null
          foraging_modifier?: number
          herbalism_modifier?: number
          id?: string
          is_herbalist?: boolean
          max_foraging_sessions?: number
          username?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          description: string
          elements: string[]
          id: number
          is_secret: boolean
          lore: string | null
          name: string
          recipe_text: string | null
          type: string
          unlock_code: string | null
        }
        Insert: {
          description: string
          elements: string[]
          id?: number
          is_secret: boolean
          lore?: string | null
          name: string
          recipe_text?: string | null
          type: string
          unlock_code?: string | null
        }
        Update: {
          description?: string
          elements?: string[]
          id?: number
          is_secret?: boolean
          lore?: string | null
          name?: string
          recipe_text?: string | null
          type?: string
          unlock_code?: string | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string | null
          display_order: number
          id: number
          name: string
          stat: string
        }
        Insert: {
          created_at?: string | null
          display_order: number
          id?: number
          name: string
          stat: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: number
          name?: string
          stat?: string
        }
        Relationships: []
      }
      user_brewed: {
        Row: {
          character_id: string | null
          choices: Json | null
          computed_description: string | null
          created_at: string | null
          effects: string
          id: number
          quantity: number
          type: string
          user_id: string
        }
        Insert: {
          character_id?: string | null
          choices?: Json | null
          computed_description?: string | null
          created_at?: string | null
          effects: string
          id?: number
          quantity?: number
          type: string
          user_id: string
        }
        Update: {
          character_id?: string | null
          choices?: Json | null
          computed_description?: string | null
          created_at?: string | null
          effects?: string
          id?: number
          quantity?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_brewed_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          character_id: string | null
          herb_id: number
          id: number
          quantity: number
          user_id: string
        }
        Insert: {
          character_id?: string | null
          herb_id: number
          id?: number
          quantity?: number
          user_id: string
        }
        Update: {
          character_id?: string | null
          herb_id?: number
          id?: number
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_inventory_herb_id_fkey"
            columns: ["herb_id"]
            isOneToOne: false
            referencedRelation: "herbs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_recipes: {
        Row: {
          character_id: string | null
          id: number
          recipe_id: number
          user_id: string
        }
        Insert: {
          character_id?: string | null
          id?: number
          recipe_id: number
          user_id: string
        }
        Update: {
          character_id?: string | null
          id?: number
          recipe_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_recipes_recipe"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_recipes_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recipes_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      weapon_templates: {
        Row: {
          base_cost_gp: number | null
          category: Database["public"]["Enums"]["weapon_category"]
          created_at: string | null
          damage_dice: string
          damage_type: Database["public"]["Enums"]["damage_type"]
          description: string | null
          id: number
          name: string
          properties: string[] | null
          range_long: number | null
          range_normal: number | null
          versatile_dice: string | null
          weight_lb: number | null
        }
        Insert: {
          base_cost_gp?: number | null
          category: Database["public"]["Enums"]["weapon_category"]
          created_at?: string | null
          damage_dice: string
          damage_type: Database["public"]["Enums"]["damage_type"]
          description?: string | null
          id?: number
          name: string
          properties?: string[] | null
          range_long?: number | null
          range_normal?: number | null
          versatile_dice?: string | null
          weight_lb?: number | null
        }
        Update: {
          base_cost_gp?: number | null
          category?: Database["public"]["Enums"]["weapon_category"]
          created_at?: string | null
          damage_dice?: string
          damage_type?: Database["public"]["Enums"]["damage_type"]
          description?: string | null
          id?: number
          name?: string
          properties?: string[] | null
          range_long?: number | null
          range_normal?: number | null
          versatile_dice?: string | null
          weight_lb?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_character_herbs: {
        Args: { p_character_id: string; p_herb_id: number; p_quantity?: number }
        Returns: Json
      }
      brew_items: {
        Args: {
          p_brew_type: string
          p_character_id: string
          p_choices?: Json
          p_computed_description: string
          p_effects: Json
          p_herbs_to_remove: Json
          p_success_count?: number
        }
        Returns: Json
      }
      consume_character_brewed_item: {
        Args: { p_brewed_id: number; p_quantity?: number }
        Returns: Json
      }
      consume_character_item: {
        Args: { p_character_id: string; p_item_id: string; p_quantity?: number }
        Returns: Json
      }
      remove_character_herbs: {
        Args: { p_character_id: string; p_herb_id: number; p_quantity?: number }
        Returns: Json
      }
    }
    Enums: {
      damage_type:
        | "slashing"
        | "piercing"
        | "bludgeoning"
        | "fire"
        | "cold"
        | "lightning"
        | "acid"
        | "poison"
        | "necrotic"
        | "radiant"
        | "force"
        | "psychic"
        | "thunder"
      weapon_category:
        | "simple_melee"
        | "simple_ranged"
        | "martial_melee"
        | "martial_ranged"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      damage_type: [
        "slashing",
        "piercing",
        "bludgeoning",
        "fire",
        "cold",
        "lightning",
        "acid",
        "poison",
        "necrotic",
        "radiant",
        "force",
        "psychic",
        "thunder",
      ],
      weapon_category: [
        "simple_melee",
        "simple_ranged",
        "martial_melee",
        "martial_ranged",
      ],
    },
  },
} as const
