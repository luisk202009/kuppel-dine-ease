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
      areas: {
        Row: {
          branch_id: string
          color: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          branch_id: string
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_areas_branch"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_registers: {
        Row: {
          branch_id: string
          cashier_id: string
          closed_at: string | null
          difference: number | null
          expected_amount: number | null
          final_amount: number | null
          id: string
          initial_amount: number
          is_active: boolean
          notes: string | null
          opened_at: string
        }
        Insert: {
          branch_id: string
          cashier_id: string
          closed_at?: string | null
          difference?: number | null
          expected_amount?: number | null
          final_amount?: number | null
          id?: string
          initial_amount?: number
          is_active?: boolean
          notes?: string | null
          opened_at?: string
        }
        Update: {
          branch_id?: string
          cashier_id?: string
          closed_at?: string | null
          difference?: number | null
          expected_amount?: number | null
          final_amount?: number | null
          id?: string
          initial_amount?: number
          is_active?: boolean
          notes?: string | null
          opened_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_registers_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          billing_period: string | null
          business_type: Database["public"]["Enums"]["business_type"] | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          owner_id: string | null
          phone: string | null
          plan_id: string | null
          subscription_status: string | null
          tax_id: string | null
          trial_end_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          billing_period?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          owner_id?: string | null
          phone?: string | null
          plan_id?: string | null
          subscription_status?: string | null
          tax_id?: string | null
          trial_end_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          billing_period?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string | null
          phone?: string | null
          plan_id?: string | null
          subscription_status?: string | null
          tax_id?: string | null
          trial_end_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      company_subscriptions: {
        Row: {
          billing_period: string
          cancel_at: string | null
          company_id: string
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          notes: string | null
          plan_id: string
          status: string
          trial_end_at: string | null
          updated_at: string
        }
        Insert: {
          billing_period: string
          cancel_at?: string | null
          company_id: string
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          notes?: string | null
          plan_id: string
          status: string
          trial_end_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_period?: string
          cancel_at?: string | null
          company_id?: string
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          notes?: string | null
          plan_id?: string
          status?: string
          trial_end_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company_id: string
          created_at: string
          email: string | null
          id: string
          identification: string | null
          last_name: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          identification?: string | null
          last_name?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          identification?: string | null
          last_name?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          branch_id: string
          cash_register_id: string | null
          category: string | null
          created_at: string
          description: string
          id: string
          receipt_url: string | null
          user_id: string
        }
        Insert: {
          amount: number
          branch_id: string
          cash_register_id?: string | null
          category?: string | null
          created_at?: string
          description: string
          id?: string
          receipt_url?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          branch_id?: string
          cash_register_id?: string | null
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          receipt_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          action: Database["public"]["Enums"]["log_action"]
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["log_action"]
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["log_action"]
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          product_id: string
          quantity?: number
          total_price: number
          unit_price: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          branch_id: string
          cashier_id: string | null
          created_at: string
          customer_id: string | null
          discount: number
          id: string
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_reference: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          table_id: string | null
          tax_amount: number
          tax_rate: number
          tip: number
          total: number
          updated_at: string
          waiter_id: string | null
        }
        Insert: {
          branch_id: string
          cashier_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string | null
          tax_amount?: number
          tax_rate?: number
          tip?: number
          total?: number
          updated_at?: string
          waiter_id?: string | null
        }
        Update: {
          branch_id?: string
          cashier_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string | null
          tax_amount?: number
          tax_rate?: number
          tip?: number
          total?: number
          updated_at?: string
          waiter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_waiter_id_fkey"
            columns: ["waiter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          billing_interval_default: string
          code: string
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          limits: Json | null
          name: string
          price_monthly: number | null
          price_yearly: number | null
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          billing_interval_default?: string
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          limits?: Json | null
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          billing_interval_default?: string
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          limits?: Json | null
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          cost: number | null
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          min_stock: number | null
          price: number
          product_id: string
          sku: string | null
          stock: number | null
          updated_at: string | null
          variant_type_id: string
          variant_value: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock?: number | null
          price: number
          product_id: string
          sku?: string | null
          stock?: number | null
          updated_at?: string | null
          variant_type_id: string
          variant_value: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock?: number | null
          price?: number
          product_id?: string
          sku?: string | null
          stock?: number | null
          updated_at?: string | null
          variant_type_id?: string
          variant_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_variant_type_id_fkey"
            columns: ["variant_type_id"]
            isOneToOne: false
            referencedRelation: "variant_types"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          company_id: string
          cost: number | null
          created_at: string
          description: string | null
          has_variants: boolean | null
          id: string
          image_url: string | null
          is_active: boolean
          is_alcoholic: boolean
          min_stock: number
          name: string
          price: number
          stock: number
          updated_at: string
        }
        Insert: {
          category_id: string
          company_id: string
          cost?: number | null
          created_at?: string
          description?: string | null
          has_variants?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_alcoholic?: boolean
          min_stock?: number
          name: string
          price: number
          stock?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          company_id?: string
          cost?: number | null
          created_at?: string
          description?: string | null
          has_variants?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_alcoholic?: boolean
          min_stock?: number
          name?: string
          price?: number
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          area: string | null
          area_id: string | null
          branch_id: string
          capacity: number
          created_at: string
          current_order_id: string | null
          customers: number | null
          display_order: number | null
          id: string
          name: string
          status: Database["public"]["Enums"]["table_status"]
          updated_at: string
          waiter_id: string | null
        }
        Insert: {
          area?: string | null
          area_id?: string | null
          branch_id: string
          capacity?: number
          created_at?: string
          current_order_id?: string | null
          customers?: number | null
          display_order?: number | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["table_status"]
          updated_at?: string
          waiter_id?: string | null
        }
        Update: {
          area?: string | null
          area_id?: string | null
          branch_id?: string
          capacity?: number
          created_at?: string
          current_order_id?: string | null
          customers?: number | null
          display_order?: number | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["table_status"]
          updated_at?: string
          waiter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tables_area"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_waiter_id_fkey"
            columns: ["waiter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_companies: {
        Row: {
          branch_id: string | null
          company_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_companies_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_companies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          role: Database["public"]["Enums"]["user_role"]
          setup_completed: boolean | null
          tour_completed: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          setup_completed?: boolean | null
          tour_completed?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          setup_completed?: boolean | null
          tour_completed?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      variant_types: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "variant_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          vote: Database["public"]["Enums"]["vote_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          vote: Database["public"]["Enums"]["vote_type"]
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          vote?: Database["public"]["Enums"]["vote_type"]
        }
        Relationships: [
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cast_vote: {
        Args: { vote_type: Database["public"]["Enums"]["vote_type"] }
        Returns: Json
      }
      check_company_limits: { Args: { p_company_id: string }; Returns: Json }
      get_company_monthly_sales_stats: {
        Args: never
        Returns: {
          company_id: string
          company_name: string
          month_label: string
          total_orders_month: number
          total_sales_month: number
          year_month: string
        }[]
      }
      get_company_product_sales_stats: {
        Args: never
        Returns: {
          company_id: string
          company_name: string
          product_id: string
          product_name: string
          total_quantity_last_30d: number
          total_quantity_sold: number
          total_sales_amount: number
          total_sales_last_30d: number
        }[]
      }
      get_company_usage_stats: {
        Args: never
        Returns: {
          activity_status: string
          branches_count: number
          business_type: Database["public"]["Enums"]["business_type"]
          categories_count: number
          company_created_at: string
          company_id: string
          company_is_active: boolean
          company_name: string
          days_since_last_order: number
          documents_this_month: number
          last_order_at: string
          products_count: number
          total_orders: number
          total_orders_last_30d: number
          total_orders_prev_30d: number
          total_sales_amount: number
          total_sales_last_30d: number
          total_sales_prev_30d: number
          users_count: number
        }[]
      }
      get_customer_profiles: {
        Args: never
        Returns: {
          address: string
          city: string
          company_id: string
          created_at: string
          email: string
          id: string
          last_name: string
          name: string
          notes: string
          phone: string
          updated_at: string
        }[]
      }
      get_user_branches: { Args: never; Returns: string[] }
      get_user_companies: { Args: never; Returns: string[] }
      get_user_profiles: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }[]
      }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_role_safe: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_vote_counts: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_user_role: {
        Args: { _role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      is_company_owner: { Args: never; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      seed_default_data_for_business_type: {
        Args: {
          _branch_id: string
          _business_type: string
          _company_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      business_type:
        | "restaurant"
        | "cafe"
        | "pizzeria"
        | "bar"
        | "retail"
        | "bakery"
        | "other"
      log_action: "insert" | "update" | "delete"
      order_status:
        | "pending"
        | "preparing"
        | "ready"
        | "delivered"
        | "paid"
        | "cancelled"
      payment_method: "cash" | "card" | "credit" | "transfer"
      table_status: "available" | "occupied" | "pending" | "reserved"
      user_role:
        | "admin"
        | "cashier"
        | "demo"
        | "platform_admin"
        | "company_owner"
        | "staff"
        | "viewer"
      vote_type: "up" | "down"
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
      business_type: [
        "restaurant",
        "cafe",
        "pizzeria",
        "bar",
        "retail",
        "bakery",
        "other",
      ],
      log_action: ["insert", "update", "delete"],
      order_status: [
        "pending",
        "preparing",
        "ready",
        "delivered",
        "paid",
        "cancelled",
      ],
      payment_method: ["cash", "card", "credit", "transfer"],
      table_status: ["available", "occupied", "pending", "reserved"],
      user_role: [
        "admin",
        "cashier",
        "demo",
        "platform_admin",
        "company_owner",
        "staff",
        "viewer",
      ],
      vote_type: ["up", "down"],
    },
  },
} as const
