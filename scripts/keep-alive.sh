#!/bin/bash

# Supabase Keep-Alive Script
# Add this to your crontab to run daily:
# 0 0 * * * /path/to/keep-alive.sh
#
# Make sure to set the environment variables or replace them below.

SUPABASE_URL="TU_SUPABASE_URL"
SUPABASE_KEY="TU_SUPABASE_ANON_KEY"

# Simple GET request to a table (e.g., categories) with a limit of 1 to minimize load
curl -s -X GET "$SUPABASE_URL/rest/v1/categories?select=id&limit=1" \
     -H "apikey: $SUPABASE_KEY" \
     -H "Authorization: Bearer $SUPABASE_KEY" > /dev/null

if [ $? -eq 0 ]; then
    echo "$(date): Supabase ping successful"
else
    echo "$(date): Supabase ping failed"
fi
