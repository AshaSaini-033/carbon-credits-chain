#!/usr/bin/env python3
"""
Blue Carbon Estimation Tool
Calculates carbon sequestration from mangrove/seagrass imagery and field data.
"""

import json
import sys
import argparse
from typing import Dict, Any

def estimate_biomass_from_canopy(canopy_area_m2: float, avg_density_kg_m2: float) -> Dict[str, float]:
    """
    Estimate biomass from canopy area and density measurements.
    
    Args:
        canopy_area_m2: Canopy cover area in square meters
        avg_density_kg_m2: Average biomass density in kg/m²
    
    Returns:
        Dictionary with biomass calculations
    """
    
    # Calculate total above-ground biomass
    biomass_kg = canopy_area_m2 * avg_density_kg_m2
    
    # Carbon content is typically 47% of biomass for mangroves
    carbon_content_ratio = 0.47
    carbon_kg = biomass_kg * carbon_content_ratio
    
    # Convert carbon to CO2 equivalent (molecular weight ratio: 44/12)
    co2_conversion_factor = 3.67
    co2_kg = carbon_kg * co2_conversion_factor
    co2_tonnes = co2_kg / 1000
    
    # Add below-ground carbon (roots) - typically 20% additional for mangroves
    below_ground_factor = 1.2
    total_co2_tonnes = co2_tonnes * below_ground_factor
    
    return {
        'canopy_area_m2': canopy_area_m2,
        'avg_density_kg_m2': avg_density_kg_m2,
        'above_ground_biomass_kg': biomass_kg,
        'carbon_kg': carbon_kg,
        'co2_tonnes': co2_tonnes,
        'total_co2_tonnes_with_roots': total_co2_tonnes,
        'methodology': 'Simple canopy-based estimation with root factor'
    }

def process_mrv_data(input_file: str) -> Dict[str, Any]:
    """
    Process MRV input data and calculate carbon estimates.
    
    Args:
        input_file: Path to JSON file with measurement data
    
    Returns:
        Complete MRV calculation results
    """
    
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    # Extract required fields
    canopy_area = data.get('canopy_area_m2', 0)
    density = data.get('avg_biomass_density_kg_m2', 0)
    
    if canopy_area <= 0 or density <= 0:
        raise ValueError("Invalid canopy area or density values")
    
    # Calculate carbon estimates
    results = estimate_biomass_from_canopy(canopy_area, density)
    
    # Add metadata
    results.update({
        'input_data': data,
        'calculation_timestamp': '2024-01-15T10:30:00Z',
        'version': '1.0.0',
        'notes': 'Simplified calculation for demo purposes'
    })
    
    return results

def main():
    """Main CLI interface for carbon estimation."""
    
    parser = argparse.ArgumentParser(
        description='Estimate blue carbon sequestration from field measurements'
    )
    parser.add_argument(
        '--input', '-i', 
        required=True,
        help='Input JSON file with measurement data'
    )
    parser.add_argument(
        '--output', '-o',
        help='Output JSON file (default: stdout)'
    )
    parser.add_argument(
        '--canopy-area', 
        type=float,
        help='Canopy area in m² (overrides JSON)'
    )
    parser.add_argument(
        '--density',
        type=float, 
        help='Biomass density in kg/m² (overrides JSON)'
    )
    
    args = parser.parse_args()
    
    try:
        # Process input data or use CLI arguments
        if args.canopy_area and args.density:
            results = estimate_biomass_from_canopy(args.canopy_area, args.density)
            results['input_source'] = 'cli_arguments'
        else:
            results = process_mrv_data(args.input)
        
        # Output results
        output_json = json.dumps(results, indent=2)
        
        if args.output:
            with open(args.output, 'w') as f:
                f.write(output_json)
            print(f"Results saved to {args.output}")
        else:
            print(output_json)
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()

# Example usage:
# python estimate_carbon.py --input sample_data.json
# python estimate_carbon.py --canopy-area 5000 --density 15.5