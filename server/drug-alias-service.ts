// Drug alias service using RxNorm API for comprehensive brand/generic mapping
export interface DrugAlias {
  brandName: string;
  genericName: string;
  rxcui: string;
  strength?: string;
  dosageForm?: string;
}

export interface DrugSearchResult {
  name: string;
  type: 'brand' | 'generic' | 'ingredient';
  rxcui: string;
  aliases: string[];
  relatedDrugs: DrugAlias[];
}

// RxNorm API client for drug name resolution
export class DrugAliasService {
  private baseUrl = 'https://rxnav.nlm.nih.gov/REST';
  private cache = new Map<string, DrugSearchResult>();

  /**
   * Main search function - finds all related drug names for a given input
   */
  async searchDrugAliases(inputName: string): Promise<DrugSearchResult | null> {
    const normalizedInput = inputName.toLowerCase().trim();
    
    // Check cache first
    if (this.cache.has(normalizedInput)) {
      return this.cache.get(normalizedInput)!;
    }

    try {
      // Step 1: Get all drugs matching the input name
      const drugsResponse = await fetch(`${this.baseUrl}/drugs.json?name=${encodeURIComponent(inputName)}`);
      if (!drugsResponse.ok) return null;
      
      const drugsData = await drugsResponse.json();
      
      if (!drugsData.drugGroup?.conceptGroup) {
        return null;
      }

      const result: DrugSearchResult = {
        name: inputName,
        type: 'generic',
        rxcui: '',
        aliases: [],
        relatedDrugs: []
      };

      const allRxcuis = new Set<string>();
      const allNames = new Set<string>();

      // Step 2: Extract all RXCUIs and related concepts
      for (const group of drugsData.drugGroup.conceptGroup) {
        if (!group.conceptProperties) continue;

        for (const concept of group.conceptProperties) {
          allRxcuis.add(concept.rxcui);
          allNames.add(concept.name);
          
          // Determine if this is a brand or generic based on term type
          if (group.tty === 'SBD' || group.tty === 'BPCK') {
            result.type = 'brand';
          }
          
          if (!result.rxcui) {
            result.rxcui = concept.rxcui;
          }
        }
      }

      // Step 3: For each RXCUI, get related brand/generic names
      for (const rxcui of Array.from(allRxcuis).slice(0, 5)) { // Limit to prevent API overload
        await this.getRelatedDrugNames(rxcui, result, allNames);
      }

      result.aliases = Array.from(allNames).filter(name => 
        name.toLowerCase() !== normalizedInput
      );

      // Cache the result
      this.cache.set(normalizedInput, result);
      
      return result;

    } catch (error) {
      console.error('RxNorm API error:', error);
      return null;
    }
  }

  /**
   * Get related drug names (brand/generic equivalents) for a given RXCUI
   */
  private async getRelatedDrugNames(rxcui: string, result: DrugSearchResult, allNames: Set<string>) {
    try {
      // Get all related concepts
      const relatedResponse = await fetch(`${this.baseUrl}/rxcui/${rxcui}/related.json?tty=SBD+GPCK+BPCK+SCD`);
      if (!relatedResponse.ok) return;
      
      const relatedData = await relatedResponse.json();
      
      if (!relatedData.relatedGroup?.conceptGroup) return;

      for (const group of relatedData.relatedGroup.conceptGroup) {
        if (!group.conceptProperties) continue;

        for (const concept of group.conceptProperties) {
          allNames.add(concept.name);
          
          // Extract brand and generic information
          const drugAlias: DrugAlias = {
            brandName: '',
            genericName: '',
            rxcui: concept.rxcui
          };

          // Determine if this is a brand or generic drug
          if (group.tty === 'SBD' || group.tty === 'BPCK') {
            drugAlias.brandName = concept.name;
            await this.getGenericForBrand(concept.rxcui, drugAlias);
          } else if (group.tty === 'SCD' || group.tty === 'GPCK') {
            drugAlias.genericName = concept.name;
            await this.getBrandForGeneric(concept.rxcui, drugAlias);
          }

          if (drugAlias.brandName || drugAlias.genericName) {
            result.relatedDrugs.push(drugAlias);
          }
        }
      }
    } catch (error) {
      console.error('Error getting related drug names:', error);
    }
  }

  /**
   * Get generic name for a brand drug RXCUI
   */
  private async getGenericForBrand(rxcui: string, drugAlias: DrugAlias) {
    try {
      const response = await fetch(`${this.baseUrl}/rxcui/${rxcui}/related.json?tty=SCD`);
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.relatedGroup?.conceptGroup?.[0]?.conceptProperties?.[0]) {
        drugAlias.genericName = data.relatedGroup.conceptGroup[0].conceptProperties[0].name;
      }
    } catch (error) {
      console.error('Error getting generic for brand:', error);
    }
  }

  /**
   * Get brand names for a generic drug RXCUI
   */
  private async getBrandForGeneric(rxcui: string, drugAlias: DrugAlias) {
    try {
      const response = await fetch(`${this.baseUrl}/rxcui/${rxcui}/related.json?tty=SBD`);
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.relatedGroup?.conceptGroup?.[0]?.conceptProperties?.[0]) {
        drugAlias.brandName = data.relatedGroup.conceptGroup[0].conceptProperties[0].name;
      }
    } catch (error) {
      console.error('Error getting brand for generic:', error);
    }
  }

  /**
   * Quick brand to generic lookup
   */
  async getBrandToGenericMapping(brandName: string): Promise<string | null> {
    const result = await this.searchDrugAliases(brandName);
    
    if (!result) return null;

    // Find the most likely generic equivalent
    for (const drug of result.relatedDrugs) {
      if (drug.genericName && drug.brandName.toLowerCase().includes(brandName.toLowerCase())) {
        return drug.genericName;
      }
    }

    // If direct mapping not found, look for generic in aliases
    for (const alias of result.aliases) {
      if (this.seemsLikeGeneric(alias)) {
        return alias;
      }
    }

    return null;
  }

  /**
   * Quick generic to brand lookup
   */
  async getGenericToBrandMapping(genericName: string): Promise<string[]> {
    const result = await this.searchDrugAliases(genericName);
    
    if (!result) return [];

    const brands: string[] = [];
    
    for (const drug of result.relatedDrugs) {
      if (drug.brandName && drug.genericName.toLowerCase().includes(genericName.toLowerCase())) {
        brands.push(drug.brandName);
      }
    }

    return brands;
  }

  /**
   * Helper to determine if a drug name seems like a generic (lowercase, chemical-sounding)
   */
  private seemsLikeGeneric(name: string): boolean {
    return (
      name === name.toLowerCase() && // Generic names are typically lowercase
      !name.includes(' ') && // Usually single words
      name.length > 4 && // Reasonable length
      !this.seemsLikeBrand(name)
    );
  }

  /**
   * Helper to determine if a drug name seems like a brand (capitalized, shorter)
   */
  private seemsLikeBrand(name: string): boolean {
    return (
      name[0] === name[0].toUpperCase() && // Starts with capital
      name.length < 15 && // Brand names are typically shorter
      !name.includes('/')  // Avoid combination drug notation
    );
  }

  /**
   * Get all known aliases for a drug name
   */
  async getAllAliases(drugName: string): Promise<string[]> {
    const result = await this.searchDrugAliases(drugName);
    
    if (!result) return [drugName];

    const allAliases = new Set([drugName]);
    
    // Add direct aliases
    result.aliases.forEach(alias => allAliases.add(alias));
    
    // Add brand/generic pairs
    result.relatedDrugs.forEach(drug => {
      if (drug.brandName) allAliases.add(drug.brandName);
      if (drug.genericName) allAliases.add(drug.genericName);
    });

    return Array.from(allAliases);
  }
}

// Singleton instance
export const drugAliasService = new DrugAliasService();