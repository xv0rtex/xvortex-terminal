package com.soriaruiz.portfolio.repository;

import com.soriaruiz.portfolio.model.HackRanking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HackRankingRepository extends JpaRepository<HackRanking, Long> {
    List<HackRanking> findTop5ByOrderByTimeMsAsc();
}