package com.dromatic.inventory.item;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ItemImageRepository extends JpaRepository<ItemImage, Long> {

    Optional<ItemImage> findByItemIdAndSide(Long itemId, String side);

    /** Solo los lados que existen, sin cargar las imágenes. */
    @Query("SELECT im.side FROM ItemImage im WHERE im.item.id = :itemId")
    List<String> findSides(@Param("itemId") Long itemId);
}
