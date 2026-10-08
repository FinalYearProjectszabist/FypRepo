package com.evplatform.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.stereotype.Component;

/** JPA converter: column is stored AES-256 encrypted, entity field is plain text. */
@Component
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private final AesEncryptor encryptor;

    public EncryptedStringConverter(AesEncryptor encryptor) {
        this.encryptor = encryptor;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        return encryptor.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return encryptor.decrypt(dbData);
    }
}
