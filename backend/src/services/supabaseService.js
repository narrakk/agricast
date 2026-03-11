const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Returns all stored locations.
 */
async function getLocations() {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('name');
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
}

/**
 * Returns all crop types.
 */
async function getCrops() {
  const { data, error } = await supabase
    .from('crops')
    .select('*')
    .order('name');
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
}

/**
 * Logs a weather alert to the database.
 */
async function logAlert(locationId, alertType, severity, message) {
  const { data, error } = await supabase
    .from('alerts_log')
    .insert({ location_id: locationId, alert_type: alertType, severity, message });
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
}

/**
 * Returns recent unacknowledged alerts for a location.
 */
async function getRecentAlerts(locationId, limit = 10) {
  const { data, error } = await supabase
    .from('alerts_log')
    .select('*')
    .eq('location_id', locationId)
    .eq('acknowledged', false)
    .order('triggered_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
}

module.exports = {
  supabase,
  getLocations,
  getCrops,
  logAlert,
  getRecentAlerts
};