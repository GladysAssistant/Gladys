function parseWebSocketValue(value, mapping = null) {
    // Validation de base
    if (!value || typeof value !== 'object') {
        return null;
    }

    // Si on a un mapping spécifique, l'utiliser
    if (mapping && mapping.valueProperty) {
        const rawValue = value[mapping.valueProperty];

        if (rawValue === undefined || rawValue === null) {
            return null;
        }

        // Gestion des énumérations (ex: HvacPower)
        if (mapping.enumMapping && mapping.enumMapping[rawValue] !== undefined) {
            return mapping.enumMapping[rawValue];
        }

        // Gestion des nombres avec formatage
        if (mapping.decimalPlaces !== undefined && typeof rawValue === 'number') {
            const formattedValue = Number(rawValue.toFixed(mapping.decimalPlaces));
            return isNaN(formattedValue) ? null : formattedValue;
        }

        // Gestion des booléens
        if (mapping.valueProperty === 'boolValue') {
            return rawValue ? 1 : 0;
        }

        // Gestion des entiers
        if (mapping.valueProperty === 'intValue') {
            const intValue = parseInt(rawValue);
            return isNaN(intValue) ? null : intValue;
        }

        // Valeur brute pour les autres types
        if (typeof rawValue === 'number' && isNaN(rawValue)) {
            return null;
        }
        return rawValue;
    }

    // Fallback pour l'ancien système (rétrocompatibilité)
    if (value.stringValue !== undefined) {
        const num = parseFloat(value.stringValue);
        return isNaN(num) ? value.stringValue : num;
    } else if (value.locationValue) {
        return {
            latitude: value.locationValue.latitude,
            longitude: value.locationValue.longitude
        };
    } else if (value.doorValue !== undefined) {
        // Parse door state according to Tessie documentation
        // Doors message: bool DriverFront = 1; bool DriverRear = 2; bool PassengerFront = 3; bool PassengerRear = 4; bool TrunkFront = 5; bool TrunkRear = 6;
        const doorValue = parseInt(value.doorValue);
        if (isNaN(doorValue)) {
            return null;
        }
        return {
            driverFront: (doorValue & 1) !== 0,      // bit 0
            driverRear: (doorValue & 2) !== 0,       // bit 1  
            passengerFront: (doorValue & 4) !== 0,   // bit 2
            passengerRear: (doorValue & 8) !== 0,    // bit 3
            trunkFront: (doorValue & 16) !== 0,      // bit 4
            trunkRear: (doorValue & 32) !== 0        // bit 5
        };
    } else if (value.doubleValue !== undefined) {
        const doubleValue = value.doubleValue;
        return isNaN(doubleValue) ? null : doubleValue;
    } else if (value.intValue !== undefined) {
        const intValue = value.intValue;
        return isNaN(intValue) ? null : intValue;
    } else if (value.boolValue !== undefined) {
        return value.boolValue ? 1 : 0;
    }

    return null;
}

module.exports = parseWebSocketValue; 