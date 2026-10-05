package com.snaptech.backend.repository;

import com.snaptech.backend.model.RiskExplanation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RiskExplanationRepository extends JpaRepository<RiskExplanation, Long> {
    List<RiskExplanation> findByPredictionIdOrderByAttributionRankAsc(Long predictionId);
}
