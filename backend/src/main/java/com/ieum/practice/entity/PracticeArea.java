package com.ieum.practice.entity;

/** [역할] DB에 저장되는 기존 학습 영역. API의 새 영역명은 apiName()으로 변환한다. */
public enum PracticeArea {
    SAFETY, HELP, EMOTION;

    public String apiName() {
        return switch (this) {
            case SAFETY -> "SAFETY";
            case HELP -> "RELATION";
            case EMOTION -> "MIND";
        };
    }
}
