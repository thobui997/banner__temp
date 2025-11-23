import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * Image Upload Service
 *
 * Service xử lý upload và convert image từ local file.
 * Features:
 * - Upload image từ file input
 * - Convert File to Base64 Data URL
 * - Validate file type (chỉ cho phép image)
 * - Validate file size (max 5MB)
 * - Error handling
 *
 * SOLID Principles:
 * - Single Responsibility: Chỉ xử lý image upload và conversion
 * - Interface Segregation: Clear public API
 */
@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  // Max file size: 5MB
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;

  // Allowed image types
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  /**
   * Upload image từ file và convert sang Data URL
   *
   * @param file - File object từ input[type="file"]
   * @returns Observable<string> - Data URL của image
   */
  uploadImage(file: File): Observable<string> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return of('').pipe(
        map(() => {
          throw new Error(validation.error || 'Invalid file');
        })
      );
    }

    // Convert file to Data URL
    return from(this.fileToDataURL(file)).pipe(
      catchError((error) => {
        console.error('Error uploading image:', error);
        throw error;
      })
    );
  }

  /**
   * Convert File object to Base64 Data URL
   *
   * @param file - File object
   * @returns Promise<string> - Data URL
   */
  private fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate file before upload
   *
   * @param file - File object to validate
   * @returns Validation result với error message nếu invalid
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check if file exists
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`
      };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    return { valid: true };
  }

  /**
   * Upload multiple images
   *
   * @param files - Array of File objects
   * @returns Observable<string[]> - Array of Data URLs
   */
  uploadMultipleImages(files: File[]): Observable<string[]> {
    const uploadPromises = files.map((file) => this.fileToDataURL(file));

    return from(Promise.all(uploadPromises)).pipe(
      catchError((error) => {
        console.error('Error uploading multiple images:', error);
        throw error;
      })
    );
  }

  /**
   * Get allowed file types for input accept attribute
   *
   * @returns String for input accept attribute
   */
  getAllowedTypesString(): string {
    return this.ALLOWED_TYPES.join(',');
  }

  /**
   * Format file size to human-readable format
   *
   * @param bytes - File size in bytes
   * @returns Formatted string (e.g., "1.5 MB")
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
